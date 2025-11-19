from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from todos.models import Todo
from todos.templatetags.repeat_tags import repeat
from todos.views import parse_due_date


class AuthAndFilterTests(TestCase):
    def test_repeat_filter_and_parse_due_date(self):
        # repeat filter valid
        assert repeat("x", 3) == "xxx"
        assert repeat("x", "2") == "xx"
        assert repeat("x", 0) == ""
        assert repeat("x", "bad") == ""

        # parse_due_date
        d = parse_due_date("2025-11-19", "5")
        assert d is not None
        assert d.tzinfo is not None

        none_dt = parse_due_date("", None)
        assert none_dt is None

    def test_register_login_logout_views(self):
        register_url = reverse("register")
        login_url = reverse("login")
        logout_url = reverse("logout")

        # register a new user
        resp = self.client.post(
            register_url,
            {
                "username": "tester",
                "password1": "safepassword123",
                "password2": "safepassword123",
            },
        )
        # should redirect to todo_list
        self.assertEqual(resp.status_code, 302)
        user = User.objects.filter(username="tester").first()
        self.assertIsNotNone(user)

        # logout
        resp = self.client.get(logout_url)
        self.assertEqual(resp.status_code, 302)

        # login with created user
        resp = self.client.post(login_url, {"username": "tester", "password": "safepassword123"})
        self.assertIn(resp.status_code, (200, 302))

    def test_create_effort_sanitization(self):
        user = User.objects.create_user(username="u1", password="pw")
        self.client.force_login(user)

        # create todo with bad effort -> should sanitize to 0
        resp = self.client.post(reverse("create_todo"), {"title": "t1", "effort": "bad"})
        self.assertEqual(resp.status_code, 302)
        todo = Todo.objects.filter(title="t1", user=user).first()
        self.assertIsNotNone(todo)
        self.assertEqual(todo.effort, 0)

        # create another with high effort -> capped at 10
        resp = self.client.post(reverse("create_todo"), {"title": "t2", "effort": "999"})
        t2 = Todo.objects.filter(title="t2", user=user).first()
        self.assertIsNotNone(t2)
        self.assertEqual(t2.effort, 10)
