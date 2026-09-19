import datetime
from typing import Optional
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database.db import get_db
from backend.database.models import User, UserRole
from backend.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    # bcrypt handles passwords up to 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (
        expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    full_name: str
    role: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def require_roles(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}",
            )
        return current_user

    return role_checker


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter((User.username == req.username) | (User.email == req.username))
        .first()
    )
    if not user or not verify_password(req.password, user.hashed_password):
        log_audit_event(
            db,
            action="LOGIN_FAILED",
            status="FAILURE",
            details={"attempted_username": req.username},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    log_audit_event(
        db,
        action="USER_LOGIN",
        user_id=user.id,
        details={"role": user.role.value, "username": user.username},
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value,
    }


@router.post("/token", response_model=Token)
def token_form_login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    return login(LoginRequest(username=form_data.username, password=form_data.password), db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


def seed_default_users(db: Session):
    """Seed standard accounts for demo & testing if they don't already exist or update hashes"""
    default_users = [
        ("admin", "admin@docshield.ai", "Admin@123", "Chief Administrator", UserRole.ADMIN),
        ("supervisor", "supervisor@docshield.ai", "Super@123", "Border Supervisor Evans", UserRole.SUPERVISOR),
        ("reviewer", "reviewer@docshield.ai", "Review@123", "Senior Screening Officer Diaz", UserRole.REVIEWER),
        ("analyst", "analyst@docshield.ai", "Analyst@123", "Forensics Analyst Kim", UserRole.ANALYST),
    ]
    for uname, email, pwd, fname, role in default_users:
        user = db.query(User).filter(User.username == uname).first()
        if not user:
            user = User(
                username=uname,
                email=email,
                hashed_password=get_password_hash(pwd),
                full_name=fname,
                role=role,
                is_active=True,
            )
            db.add(user)
        else:
            # Update password hash to native bcrypt
            user.hashed_password = get_password_hash(pwd)
    db.commit()
