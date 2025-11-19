"""
Model factories for testing using factory-boy.

These factories provide a convenient way to create test data with sensible defaults
while allowing customization when needed.
"""

from django.contrib.auth.models import User
from django.utils import timezone

import factory
from factory.django import DjangoModelFactory

from todos.models import Category, Todo


class UserFactory(DjangoModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = User
        django_get_or_create = ("username",)

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default _create to use create_user for proper password handling."""
        manager = cls._get_manager(model_class)
        if "password" in kwargs:
            password = kwargs.pop("password")
        else:
            password = "testpass123"
        return manager.create_user(*args, **kwargs, password=password)


class CategoryFactory(DjangoModelFactory):
    """Factory for creating Category instances."""

    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f"Category {n}")
    user = factory.SubFactory(UserFactory)
    order = factory.Sequence(lambda n: n)


class TodoFactory(DjangoModelFactory):
    """Factory for creating Todo instances."""

    class Meta:
        model = Todo

    title = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("paragraph")
    user = factory.SubFactory(UserFactory)
    effort = factory.Faker("random_int", min=0, max=10)
    order = factory.Sequence(lambda n: n)

    @factory.post_generation
    def categories(self, create, extracted, **kwargs):
        """Handle many-to-many relationship with categories."""
        if not create:
            return

        if extracted:
            for category in extracted:
                self.categories.add(category)


class CompletedTodoFactory(TodoFactory):
    """Factory for creating completed Todo instances."""

    completed_at = factory.LazyFunction(timezone.now)


class TodoWithDueDateFactory(TodoFactory):
    """Factory for creating Todo instances with due dates."""

    due_date = factory.Faker(
        "date_time_between",
        start_date="+1d",
        end_date="+30d",
        tzinfo=timezone.get_current_timezone(),
    )
