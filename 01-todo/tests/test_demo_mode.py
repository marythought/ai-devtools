"""
Tests for demo mode functionality.

This module covers:
- Demo user creation and permissions
- Demo login view
- Permission checks on modification views
- Template rendering for read-only mode
"""

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from todos.models import Category, Todo
from todos.permissions import user_can_modify_todos


class DemoModePermissionsTests(TestCase):
    """Tests for demo mode permissions system."""

    def test_regular_user_has_modify_permission(self):
        """Test that regular users get modify permission by default."""
        user = User.objects.create_user(username="regularuser", password="testpass123")
        self.assertTrue(user_can_modify_todos(user))
        self.assertTrue(user.has_perm("auth.can_modify_todos"))

    def test_demo_user_lacks_modify_permission(self):
        """Test that demo user does not have modify permission."""
        # Create demo user without permission (as the management command would)
        demo_user = User.objects.create_user(username="demo-mode", password="demo1234")

        # Remove permission (signal grants it by default for non-demo users)
        from django.contrib.auth.models import Permission

        permission = Permission.objects.get(
            codename="can_modify_todos", content_type__app_label="auth"
        )
        demo_user.user_permissions.remove(permission)

        self.assertFalse(user_can_modify_todos(demo_user))
        self.assertFalse(demo_user.has_perm("auth.can_modify_todos"))

    def test_unauthenticated_user_cannot_modify(self):
        """Test that unauthenticated users cannot modify."""
        from django.contrib.auth.models import AnonymousUser

        anon_user = AnonymousUser()
        self.assertFalse(user_can_modify_todos(anon_user))


class DemoLoginViewTests(TestCase):
    """Tests for the demo_login view."""

    @classmethod
    def setUpTestData(cls):
        """Create demo user for testing."""
        cls.demo_user = User.objects.create_user(username="demo-mode", password="demo1234")
        # Remove modify permission
        from django.contrib.auth.models import Permission

        permission = Permission.objects.get(
            codename="can_modify_todos", content_type__app_label="auth"
        )
        cls.demo_user.user_permissions.remove(permission)

    def test_demo_login_success(self):
        """Test successful demo login."""
        response = self.client.get(reverse("demo_login"))

        # Should redirect to todo_list
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("todo_list"))

        # User should be logged in
        self.assertTrue(response.wsgi_request.user.is_authenticated)
        self.assertEqual(response.wsgi_request.user.username, "demo-mode")

    def test_demo_login_without_demo_user(self):
        """Test demo login when demo user doesn't exist."""
        # Delete the demo user
        User.objects.filter(username="demo-mode").delete()

        response = self.client.get(reverse("demo_login"))

        # Should redirect to login page
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("login"))

        # User should not be logged in
        self.assertFalse(response.wsgi_request.user.is_authenticated)


class DemoModeViewRestrictionTests(TestCase):
    """Tests that demo users cannot access modification views."""

    @classmethod
    def setUpTestData(cls):
        """Create demo user and regular user for testing."""
        cls.demo_user = User.objects.create_user(username="demo-mode", password="demo1234")
        cls.regular_user = User.objects.create_user(username="regular", password="testpass123")

        # Remove modify permission from demo user
        from django.contrib.auth.models import Permission

        permission = Permission.objects.get(
            codename="can_modify_todos", content_type__app_label="auth"
        )
        cls.demo_user.user_permissions.remove(permission)

    def setUp(self):
        """Set up test client with demo user logged in."""
        self.client.force_login(self.demo_user)

    def test_demo_user_cannot_create_todo(self):
        """Test that demo user cannot create todos."""
        response = self.client.post(
            reverse("create_todo"), {"title": "Test Todo", "description": "Test"}
        )

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

        # Todo should not be created
        self.assertEqual(Todo.objects.filter(title="Test Todo").count(), 0)

    def test_demo_user_cannot_toggle_todo(self):
        """Test that demo user cannot toggle todos."""
        todo = Todo.objects.create(title="Test Todo", user=self.demo_user)

        response = self.client.post(reverse("toggle_todo", args=[todo.id]))

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

    def test_demo_user_cannot_edit_todo(self):
        """Test that demo user cannot edit todos."""
        todo = Todo.objects.create(title="Original", user=self.demo_user)

        response = self.client.post(
            reverse("edit_todo", args=[todo.id]),
            {"title": "Modified", "description": "Modified description"},
        )

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

        # Todo should not be modified
        todo.refresh_from_db()
        self.assertEqual(todo.title, "Original")

    def test_demo_user_can_view_edit_form(self):
        """Test that demo user can view edit form (but template should hide submit)."""
        todo = Todo.objects.create(title="Test", user=self.demo_user)

        response = self.client.get(reverse("edit_todo", args=[todo.id]))

        # GET request should succeed
        self.assertEqual(response.status_code, 200)

    def test_demo_user_cannot_delete_todo(self):
        """Test that demo user cannot delete todos."""
        todo = Todo.objects.create(title="Test", user=self.demo_user)
        todo_id = todo.id

        response = self.client.post(reverse("delete_todo", args=[todo.id]))

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

        # Todo should still exist
        self.assertTrue(Todo.objects.filter(id=todo_id).exists())

    def test_demo_user_cannot_reorder_todos(self):
        """Test that demo user cannot reorder todos."""
        todo1 = Todo.objects.create(title="Todo 1", user=self.demo_user, order=0)
        todo2 = Todo.objects.create(title="Todo 2", user=self.demo_user, order=1)

        response = self.client.post(
            reverse("reorder_todos"),
            '{"todo_ids": [%d, %d]}' % (todo2.id, todo1.id),
            content_type="application/json",
        )

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

    def test_demo_user_cannot_create_category(self):
        """Test that demo user cannot create categories."""
        response = self.client.post(reverse("manage_categories"), {"name": "New Category"})

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

        # Category should not be created
        self.assertEqual(Category.objects.filter(name="New Category").count(), 0)

    def test_demo_user_can_view_manage_categories(self):
        """Test that demo user can view manage categories page."""
        response = self.client.get(reverse("manage_categories"))

        # GET request should succeed
        self.assertEqual(response.status_code, 200)

    def test_demo_user_cannot_delete_category(self):
        """Test that demo user cannot delete categories."""
        category = Category.objects.create(name="Test Category", user=self.demo_user)
        category_id = category.id

        response = self.client.post(reverse("delete_category", args=[category.id]))

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

        # Category should still exist
        self.assertTrue(Category.objects.filter(id=category_id).exists())

    def test_demo_user_cannot_reorder_categories(self):
        """Test that demo user cannot reorder categories."""
        cat1 = Category.objects.create(name="Cat 1", user=self.demo_user, order=0)
        cat2 = Category.objects.create(name="Cat 2", user=self.demo_user, order=1)

        response = self.client.post(
            reverse("reorder_categories"),
            '{"category_ids": [%d, %d]}' % (cat2.id, cat1.id),
            content_type="application/json",
        )

        # Should get permission denied
        self.assertEqual(response.status_code, 403)

    def test_regular_user_can_create_todo(self):
        """Test that regular users can still create todos."""
        self.client.force_login(self.regular_user)

        response = self.client.post(
            reverse("create_todo"), {"title": "Test Todo", "description": "Test"}
        )

        # Should redirect (success)
        self.assertEqual(response.status_code, 302)

        # Todo should be created
        self.assertEqual(Todo.objects.filter(title="Test Todo").count(), 1)
