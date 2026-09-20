import datetime
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from backend.database.db import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    REVIEWER = "REVIEWER"
    ANALYST = "ANALYST"


class CaseStatus(str, enum.Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    INCONCLUSIVE = "INCONCLUSIVE"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"


class ReviewPriority(str, enum.Enum):
    LOW_CONCERN = "LOW_CONCERN"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    HIGH_PRIORITY_REVIEW = "HIGH_PRIORITY_REVIEW"


class DocumentType(str, enum.Enum):
    PASSPORT = "PASSPORT"
    VISA = "VISA"
    NATIONAL_ID = "NATIONAL_ID"
    DRIVING_LICENSE = "DRIVING_LICENSE"
    PERMIT = "PERMIT"


class ValidationStatus(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"


class RuleSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    INFO = "INFO"


class TamperStatus(str, enum.Enum):
    NO_CLEAR_ANOMALY = "NO_CLEAR_ANOMALY"
    POSSIBLE_ANOMALY = "POSSIBLE_ANOMALY"
    INCONCLUSIVE = "INCONCLUSIVE"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"


class FaceOutcome(str, enum.Enum):
    SUPPORTING_MATCH = "SUPPORTING_MATCH"
    POTENTIAL_MISMATCH = "POTENTIAL_MISMATCH"
    INCONCLUSIVE = "INCONCLUSIVE"
    NOT_PERFORMED = "NOT_PERFORMED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.REVIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    reviews = relationship("ReviewAction", back_populates="user")
    audit_events = relationship("AuditEvent", back_populates="user")


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(50), primary_key=True, index=True)  # e.g. CASE-2026-0001
    title = Column(String(200), nullable=True)
    document_type = Column(SQLEnum(DocumentType), default=DocumentType.PASSPORT, nullable=False)
    status = Column(SQLEnum(CaseStatus), default=CaseStatus.PROCESSING, nullable=False, index=True)
    review_priority = Column(SQLEnum(ReviewPriority), default=ReviewPriority.NEEDS_REVIEW, nullable=False)
    overall_confidence = Column(Float, default=0.0)

    applicant_name = Column(String(150), nullable=True)
    document_number = Column(String(50), nullable=True)
    nationality = Column(String(50), nullable=True)

    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_outcome = Column(String(100), nullable=True)
    review_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    fields = relationship("DocumentField", back_populates="case", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="case", cascade="all, delete-orphan")
    tamper_results = relationship("TamperResult", back_populates="case", cascade="all, delete-orphan")
    face_results = relationship("FaceResult", back_populates="case", cascade="all, delete-orphan")
    review_actions = relationship("ReviewAction", back_populates="case", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="case", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=False, index=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_path = Column(String(300), nullable=False)
    original_filename = Column(String(200), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(50), nullable=False)
    file_hash = Column(String(64), nullable=True)
    is_live_face = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="documents")


class DocumentField(Base):
    __tablename__ = "document_fields"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    field_name = Column(String(100), nullable=False, index=True)
    value = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    # Bounding box in normalized coordinates [0.0 - 1.0]
    bbox_x = Column(Float, nullable=True)
    bbox_y = Column(Float, nullable=True)
    bbox_w = Column(Float, nullable=True)
    bbox_h = Column(Float, nullable=True)
    is_mrz = Column(Boolean, default=False)
    validation_status = Column(String(20), default="VALID")
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="fields")


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    rule_id = Column(String(50), nullable=False, index=True)
    rule_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # FORMAT, DATE, MRZ, CROSS_FIELD, TEMPLATE, REFERENCE
    status = Column(SQLEnum(ValidationStatus), nullable=False)
    severity = Column(SQLEnum(RuleSeverity), nullable=False)
    explanation = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="validation_results")


class TamperResult(Base):
    __tablename__ = "tamper_results"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    anomaly_type = Column(String(100), nullable=False)  # PHOTO_REPLACEMENT, ELA_COMPRESSION, TEXT_EDIT, NOISE, METADATA
    status = Column(SQLEnum(TamperStatus), nullable=False)
    score = Column(Float, default=0.0)
    heatmap_path = Column(String(300), nullable=True)
    explanation = Column(Text, nullable=False)
    evidence_regions_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="tamper_results")


class FaceResult(Base):
    __tablename__ = "face_results"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=False, index=True)
    document_face_detected = Column(Boolean, default=False)
    live_face_detected = Column(Boolean, default=False)
    similarity_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    outcome = Column(SQLEnum(FaceOutcome), default=FaceOutcome.NOT_PERFORMED, nullable=False)
    explanation = Column(Text, nullable=False)
    doc_portrait_path = Column(String(300), nullable=True)
    live_photo_path = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="face_results")


class RuleDefinition(Base):
    __tablename__ = "rule_definitions"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False)
    document_type = Column(String(50), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(SQLEnum(RuleSeverity), default=RuleSeverity.MAJOR, nullable=False)
    version = Column(String(20), default="1.0", nullable=False)
    is_active = Column(Boolean, default=True)


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), index=True, nullable=False)
    model_type = Column(String(50), nullable=False)  # OCR, TAMPER, FACE, VALIDATION
    version = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # CLEAR, REQUEST_BETTER_IMAGE, ESCALATE, RECORD_OUTCOME
    reason = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="review_actions")
    user = relationship("User", back_populates="reviews")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="SUCCESS")
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

    case = relationship("Case", back_populates="audit_events")
    user = relationship("User", back_populates="audit_events")
