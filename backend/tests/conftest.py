import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.config import settings
from app.main import app


@pytest.fixture(scope="session")
def temp_storage():
    """Create a temporary storage folder for certificates during tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        old_storage = settings.STORAGE_DIR
        settings.STORAGE_DIR = tmp_path
        yield tmp_path
        settings.STORAGE_DIR = old_storage


@pytest.fixture(scope="function")
def db_session(temp_storage):
    """Create a fresh in-memory SQLite database using StaticPool for multi-session support."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
