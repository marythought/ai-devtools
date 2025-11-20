"""
Tests for previously untested views.

This module covers:
- complete_and_followup() view
- manage_categories() view
- delete_category() view
"""

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from todos.models import Category, Todo


class CompleteAndFollowupViewTests(TestCase):
    """Tests for the complete_and_followup view."""

    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )

    def setUp(self):
        """Set up test client for each test."""
        self.client.force_login(self.user)

    def test_redirect_if_not_logged_in(self):
        """Test that the view redirects to login if user is not authenticated."""
        self.client.logout()
        todo = Todo.objects.create(title="Test Todo", user=self.user)
        response = self.client.post(reverse("complete_and_followup", args=[todo.id]))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response.url)

    def test_complete_todo_without_categories(self):
        """Test completing a todo without categories redirects to create page."""
        todo = Todo.objects.create(title="Test Todo", user=self.user)
        self.assertIsNone(todo.completed_at)

        response = self.client.post(reverse("complete_and_followup", args=[todo.id]))

        # Reload todo from database
        todo.refresh_from_db()

        # Check todo is marked as completed
        self.assertIsNotNone(todo.completed_at)

        # Should redirect to create_todo
        self.assertEqual(response.status_code, 302)
        self.assertIn("/create/", response.url)

    def test_complete_todo_with_categories(self):
        """Test completing a todo with categories passes category IDs in redirect URL."""
        # Create categories
        cat1 = Category.objects.create(name="Work", user=self.user)
        cat2 = Category.objects.create(name="Personal", user=self.user)

        # Create todo with categories
        todo = Todo.objects.create(title="Test Todo", user=self.user)
        todo.categories.add(cat1, cat2)

        response = self.client.post(reverse("complete_and_followup", args=[todo.id]))

        # Reload todo from database
        todo.refresh_from_db()

        # Check todo is marked as completed
        self.assertIsNotNone(todo.completed_at)

        # Should redirect to create_todo with category parameters
        self.assertEqual(response.status_code, 302)
        self.assertIn("/create/", response.url)
        self.assertIn(f"category={cat1.id}", response.url)
        self.assertIn(f"category={cat2.id}", response.url)

    def test_cannot_complete_other_user_todo(self):
        """Test that users cannot complete todos belonging to other users."""
        other_todo = Todo.objects.create(title="Other's Todo", user=self.other_user)

        response = self.client.post(
            reverse("complete_and_followup", args=[other_todo.id])
        )

        # Should get 404
        self.assertEqual(response.status_code, 404)

        # Todo should not be completed
        other_todo.refresh_from_db()
        self.assertIsNone(other_todo.completed_at)

    def test_get_request_redirects_to_list(self):
        """Test that GET requests redirect to todo list."""
        todo = Todo.objects.create(title="Test Todo", user=self.user)

        response = self.client.get(reverse("complete_and_followup", args=[todo.id]))

        # Should redirect to todo_list
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("todo_list"))

        # Todo should not be completed
        todo.refresh_from_db()
        self.assertIsNone(todo.completed_at)


class ManageCategoriesViewTests(TestCase):
    """Tests for the manage_categories view."""

    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )

    def setUp(self):
        """Set up test client for each test."""
        self.client.force_login(self.user)

    def test_redirect_if_not_logged_in(self):
        """Test that the view redirects to login if user is not authenticated."""
        self.client.logout()
        response = self.client.get(reverse("manage_categories"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response.url)

    def test_get_manage_categories_page(self):
        """Test accessing the manage categories page."""
        # Create some categories for the user
        cat1 = Category.objects.create(name="Work", user=self.user)
        cat2 = Category.objects.create(name="Personal", user=self.user)

        # Create a category for another user (should not be visible)
        Category.objects.create(name="Other", user=self.other_user)

        response = self.client.get(reverse("manage_categories"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "todos/manage_categories.html")

        # Check that only user's categories are in context
        categories = response.context["categories"]
        self.assertEqual(len(categories), 2)
        self.assertIn(cat1, categories)
        self.assertIn(cat2, categories)

    def test_create_category_via_post(self):
        """Test creating a new category via POST request."""
        initial_count = Category.objects.filter(user=self.user).count()

        response = self.client.post(
            reverse("manage_categories"), {"name": "New Category"}
        )

        # Should redirect back to manage_categories
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("manage_categories"))

        # Category should be created
        self.assertEqual(
            Category.objects.filter(user=self.user).count(), initial_count + 1
        )
        category = Category.objects.get(name="New Category", user=self.user)
        self.assertEqual(category.name, "New Category")

    def test_create_category_without_name(self):
        """Test that posting without a name doesn't create a category."""
        initial_count = Category.objects.filter(user=self.user).count()

        response = self.client.post(reverse("manage_categories"), {"name": ""})

        # Should still redirect
        self.assertEqual(response.status_code, 302)

        # No category should be created
        self.assertEqual(Category.objects.filter(user=self.user).count(), initial_count)


class DeleteCategoryViewTests(TestCase):
    """Tests for the delete_category view."""

    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )

    def setUp(self):
        """Set up test client for each test."""
        self.client.force_login(self.user)

    def test_redirect_if_not_logged_in(self):
        """Test that the view redirects to login if user is not authenticated."""
        self.client.logout()
        category = Category.objects.create(name="Test", user=self.user)
        response = self.client.post(reverse("delete_category", args=[category.id]))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response.url)

    def test_delete_category(self):
        """Test deleting a category."""
        category = Category.objects.create(name="To Delete", user=self.user)
        category_id = category.id

        response = self.client.post(reverse("delete_category", args=[category.id]))

        # Should redirect to manage_categories
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("manage_categories"))

        # Category should be deleted
        self.assertFalse(Category.objects.filter(id=category_id).exists())

    def test_cannot_delete_other_user_category(self):
        """Test that users cannot delete categories belonging to other users."""
        other_category = Category.objects.create(
            name="Other's Category", user=self.other_user
        )

        response = self.client.post(
            reverse("delete_category", args=[other_category.id])
        )

        # Should get 404
        self.assertEqual(response.status_code, 404)

        # Category should still exist
        self.assertTrue(Category.objects.filter(id=other_category.id).exists())

    def test_get_request_redirects_without_deleting(self):
        """Test that GET requests redirect without deleting the category."""
        category = Category.objects.create(name="Test", user=self.user)
        category_id = category.id

        response = self.client.get(reverse("delete_category", args=[category.id]))

        # Should redirect to manage_categories
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("manage_categories"))

        # Category should still exist
        self.assertTrue(Category.objects.filter(id=category_id).exists())
