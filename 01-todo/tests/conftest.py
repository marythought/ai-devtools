"""
Pytest configuration and shared fixtures for the TODO app test suite.
"""

from django.test import Client

import pytest
from pytest_factoryboy import register

from tests.factories import (
    CategoryFactory,
    CompletedTodoFactory,
    TodoFactory,
    TodoWithDueDateFactory,
    UserFactory,
)

# Register factories with pytest-factoryboy
# This creates fixtures automatically: user, user_factory, category, category_factory, etc.
register(UserFactory)
register(UserFactory, "other_user")
register(CategoryFactory)
register(TodoFactory)
register(CompletedTodoFactory)
register(TodoWithDueDateFactory)


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
def authenticated_other_client(client, other_user):
    """Provide a client logged in as the other user."""
    client.force_login(other_user)
    return client
