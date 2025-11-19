"""
Pytest configuration and shared fixtures for the TODO app test suite.
"""

from django.contrib.auth.models import User
from django.test import Client

import pytest

from todos.models import Category, Todo


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(username="testuser", password="testpass123")


@pytest.fixture
def other_user(db):
    """Create another test user for permission testing."""
    return User.objects.create_user(username="otheruser", password="testpass123")


@pytest.fixture
def client():
    """Provide a Django test client."""
    return Client()


@pytest.fixture
def authenticated_client(client, user):
    """Provide a client logged in as the test user."""
    client.force_login(user)
    return client


@pytest.fixture
def category(user):
    """Create a test category."""
    return Category.objects.create(name="Test Category", user=user)


@pytest.fixture
def todo(user):
    """Create a test todo."""
    return Todo.objects.create(title="Test Todo", description="Test Description", user=user)


@pytest.fixture
def completed_todo(user):
    """Create a completed test todo."""
    from django.utils import timezone

    return Todo.objects.create(title="Completed Todo", user=user, completed_at=timezone.now())
