import json
from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from todos.models import Category, Todo


class TodoViewsAndReorderingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u2", password="pw")
        self.client.force_login(self.user)

        # categories
        self.cat1 = Category.objects.create(name="c1", user=self.user)
        self.cat2 = Category.objects.create(name="c2", user=self.user)

        # todos: t1 due soon incomplete, t2 completed, t3 incomplete
        now = timezone.now()
        self.t1 = Todo.objects.create(
            title="todo1", user=self.user, due_date=now + timedelta(days=1)
        )
        self.t2 = Todo.objects.create(title="todo2", user=self.user, completed_at=now)
        self.t3 = Todo.objects.create(title="todo3", user=self.user)

    def test_todo_list_filters_and_context(self):
        url = reverse("todo_list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # should include the user's todos
        todos = resp.context["todos"]
        self.assertIn(self.t1, list(todos))

        # due_soon view should only include incomplete with due_date
        resp = self.client.get(url + "?view=due_soon")
        self.assertEqual(resp.status_code, 200)
        qs = resp.context["todos"]
        self.assertIn(self.t1, list(qs))
        self.assertNotIn(self.t2, list(qs))

        # category filter
        self.t1.categories.add(self.cat1)
        resp = self.client.get(url + f"?category={self.cat1.id}")
        qs = resp.context["todos"]
        self.assertIn(self.t1, list(qs))
        self.assertNotIn(self.t3, list(qs))

        # show_completed session toggle
        resp = self.client.get(url + "?show_completed=false")
        self.assertEqual(self.client.session.get("show_completed"), "false")

    def test_edit_and_delete_todo(self):
        # edit t1 with invalid effort (negative -> 0)
        resp = self.client.post(
            reverse("edit_todo", args=[self.t1.id]),
            {
                "title": "todo1-edited",
                "description": "d",
                "effort": "-5",
                "categories": [self.cat2.id],
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.t1.refresh_from_db()
        self.assertEqual(self.t1.title, "todo1-edited")
        self.assertEqual(self.t1.effort, 0)

        # delete
        resp = self.client.post(reverse("delete_todo", args=[self.t1.id]))
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(Todo.objects.filter(id=self.t1.id).exists())

    def test_reorder_todos_failure_and_success(self):
        # create ordering where an incomplete comes after a completed (should error)
        # place completed before incomplete to trigger the error
        todo_ids = [self.t2.id, self.t3.id]
        resp = self.client.post(
            reverse("reorder_todos"),
            data=json.dumps({"todo_ids": todo_ids}),
            content_type="application/json",
        )
        # should return 400 due to incomplete after completed
        self.assertEqual(resp.status_code, 400)

        # valid ordering should succeed
        # ensure all incomplete before completed
        todo_ids = [self.t3.id, self.t1.id, self.t2.id]
        resp = self.client.post(
            reverse("reorder_todos"),
            data=json.dumps({"todo_ids": todo_ids}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "success")

    def test_reorder_categories_and_handle_error(self):
        # calling GET on reorder endpoint should return error 400
        resp = self.client.get(reverse("reorder_categories"))
        self.assertEqual(resp.status_code, 400)

        # valid POST reorder
        cat_ids = [self.cat2.id, self.cat1.id]
        resp = self.client.post(
            reverse("reorder_categories"),
            data=json.dumps({"category_ids": cat_ids}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        # check ordering
        self.cat1.refresh_from_db()
        self.cat2.refresh_from_db()
        # one of them should have updated order (0 or 1)
        self.assertIn(self.cat1.order, (0, 1))

    def test_auth_views_invalid_paths(self):
        # invalid registration (mismatched passwords)
        resp = self.client.post(
            reverse("register"), {"username": "x", "password1": "a", "password2": "b"}
        )
        # should render page again (200) and not create user
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(User.objects.filter(username="x").exists())

        # invalid login
        resp = self.client.post(
            reverse("login"), {"username": "noone", "password": "bad"}
        )
        self.assertEqual(resp.status_code, 200)
