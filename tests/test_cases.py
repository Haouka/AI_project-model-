import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import SessionLocal, Base, engine
from backend.api.auth import seed_default_users
from backend.services.demo_generator import generate_demo_documents


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_default_users(db)
    db.close()
    generate_demo_documents()
    yield


def test_login_and_auth():
    with TestClient(app) as client:
        # Test reviewer login
        res = client.post(
            "/api/v1/auth/login",
            json={"username": "reviewer", "password": "Review@123"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "REVIEWER"

        token = data["access_token"]
        # Test me endpoint
        me_res = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "reviewer"


def test_create_and_process_case():
    with TestClient(app) as client:
        # Login
        auth_res = client.post(
            "/api/v1/auth/login",
            json={"username": "reviewer", "password": "Review@123"},
        )
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create case
        c_res = client.post(
            "/api/v1/cases",
            json={"title": "Test Passport Screening", "document_type": "PASSPORT"},
            headers=headers,
        )
        assert c_res.status_code == 201
        case_id = c_res.json()["case_id"]

        # 2. Upload demo document
        with open("storage/demo_data/demo_clean_passport.jpg", "rb") as f:
            upload_res = client.post(
                f"/api/v1/cases/{case_id}/documents",
                files={"document_file": ("passport.jpg", f, "image/jpeg")},
                headers=headers,
            )
        assert upload_res.status_code == 200

        # 3. Process screening pipeline
        proc_res = client.post(f"/api/v1/cases/{case_id}/process", headers=headers)
        assert proc_res.status_code == 200
        proc_data = proc_res.json()
        assert "status" in proc_data
        assert "review_priority" in proc_data

        # 4. Fetch evidence
        ev_res = client.get(f"/api/v1/cases/{case_id}/evidence", headers=headers)
        assert ev_res.status_code == 200
        assert "evidence_report" in ev_res.json()

        # 5. Record Review
        rev_res = client.post(
            f"/api/v1/cases/{case_id}/review",
            json={"action": "CLEAR", "notes": "Verified by screening officer."},
            headers=headers,
        )
        assert rev_res.status_code == 200
        assert rev_res.json()["new_status"] == "COMPLETED"

        # 6. Check Audit Trail
        audit_res = client.get(f"/api/v1/audit/{case_id}", headers=headers)
        assert audit_res.status_code == 200
        assert audit_res.json()["count"] >= 3
