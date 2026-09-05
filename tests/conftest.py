"""
VIGILANCE — Pytest Global Fixtures and Configuration
"""

import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend and edge directories to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "vigilance-prototype", "backend")
EDGE_DIR = os.path.join(BASE_DIR, "vigilance-prototype", "edge")

for p in [BACKEND_DIR, EDGE_DIR, BASE_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from models import Base, Detection, Cluster
from database import init_db, get_db
from main import app
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def test_engine():
    """Session-level in-memory SQLite database engine."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )
    init_db(target_engine=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Function-level clean database session rolled back after every test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
