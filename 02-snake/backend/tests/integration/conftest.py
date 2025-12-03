"""Pytest configuration for integration tests."""

import os
import pytest
from fastapi.testclient import TestClient

from app.database import Database
from app.main import app


@pytest.fixture(scope="function")
def test_db():
    """Create a test database for integration tests."""
    test_db_path = "test_integration.db"

    # Remove existing test database if it exists
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    # Create test database
    db = Database(f"sqlite:///./{test_db_path}")

    yield db

    # Cleanup
    if os.path.exists(test_db_path):
        os.remove(test_db_path)


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with test database."""
    # Override the global db instance
    from app import main

    original_db = main.db
    main.db = test_db

    test_client = TestClient(app)

    yield test_client

    # Restore original db
    main.db = original_db
