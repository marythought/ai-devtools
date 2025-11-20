from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from todos.models import Category, Todo


class TodoModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")

    def test_todo_creation(self):
        todo = Todo.objects.create(
            title="Test Todo", description="Test Description", user=self.user
        )
        self.assertEqual(todo.title, "Test Todo")
        self.assertEqual(todo.description, "Test Description")
        self.assertEqual(todo.user, self.user)
        self.assertIsNone(todo.completed_at)
        self.assertFalse(todo.is_completed)

    def test_todo_str_method(self):
        todo = Todo.objects.create(title="My Todo", user=self.user)
        self.assertEqual(str(todo), "My Todo")

    def test_todo_ordering(self):
        from django.utils import timezone

        Todo.objects.create(title="Incomplete", user=self.user)
        Todo.objects.create(
            title="Completed", completed_at=timezone.now(), user=self.user
        )
        Todo.objects.create(title="Also Incomplete", user=self.user)

        todos = Todo.objects.all()
        self.assertIsNone(todos[0].completed_at)
        self.assertIsNone(todos[1].completed_at)
        self.assertIsNotNone(todos[2].completed_at)


class TodoListViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse("todo_list"))
        self.assertEqual(response.status_code, 302)

    def test_view_url_accessible_when_logged_in(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.get(reverse("todo_list"))
        self.assertEqual(response.status_code, 200)

    def test_view_uses_correct_template(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.get(reverse("todo_list"))
        self.assertTemplateUsed(response, "todos/todo_list.html")

    def test_only_shows_user_todos(self):
        self.client.login(username="testuser", password="testpass123")
        Todo.objects.create(title="My Todo", user=self.user)
        Todo.objects.create(title="Other User Todo", user=self.other_user)

        response = self.client.get(reverse("todo_list"))
        self.assertEqual(len(response.context["todos"]), 1)
        self.assertEqual(response.context["todos"][0].title, "My Todo")


class CreateTodoViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse("create_todo"))
        self.assertEqual(response.status_code, 302)

    def test_create_todo_with_valid_data(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.post(
            reverse("create_todo"),
            {"title": "New Todo", "description": "New Description"},
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Todo.objects.count(), 1)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, "New Todo")
        self.assertEqual(todo.description, "New Description")
        self.assertEqual(todo.user, self.user)

    def test_create_todo_without_title(self):
        self.client.login(username="testuser", password="testpass123")
        self.client.post(reverse("create_todo"), {"description": "No Title"})
        self.assertEqual(Todo.objects.count(), 0)


class EditTodoViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()
        self.todo = Todo.objects.create(
            title="Original Title", description="Original Description", user=self.user
        )

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse("edit_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)

    def test_edit_todo_get_request(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.get(reverse("edit_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "todos/edit_todo.html")
        self.assertEqual(response.context["todo"], self.todo)

    def test_edit_todo_post_request(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.post(
            reverse("edit_todo", args=[self.todo.id]),
            {"title": "Updated Title", "description": "Updated Description"},
        )
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, "Updated Title")
        self.assertEqual(self.todo.description, "Updated Description")

    def test_cannot_edit_other_user_todo(self):
        self.client.login(username="otheruser", password="testpass123")
        response = self.client.get(reverse("edit_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 404)


class ToggleTodoViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")

    def setUp(self):
        """Set up test client and todo for each test."""
        self.client = Client()
        self.todo = Todo.objects.create(title="Test Todo", user=self.user)

    def test_redirect_if_not_logged_in(self):
        response = self.client.post(reverse("toggle_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)

    def test_toggle_todo_completion(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.post(reverse("toggle_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertIsNotNone(self.todo.completed_at)
        self.assertTrue(self.todo.is_completed)

        response = self.client.post(reverse("toggle_todo", args=[self.todo.id]))
        self.todo.refresh_from_db()
        self.assertIsNone(self.todo.completed_at)
        self.assertFalse(self.todo.is_completed)


class DeleteTodoViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.other_user = User.objects.create_user(
            username="otheruser", password="testpass123"
        )

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()
        self.todo = Todo.objects.create(title="Test Todo", user=self.user)

    def test_redirect_if_not_logged_in(self):
        response = self.client.post(reverse("delete_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)

    def test_delete_todo(self):
        self.client.login(username="testuser", password="testpass123")
        self.assertEqual(Todo.objects.count(), 1)
        response = self.client.post(reverse("delete_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Todo.objects.count(), 0)

    def test_cannot_delete_other_user_todo(self):
        self.client.login(username="otheruser", password="testpass123")
        response = self.client.post(reverse("delete_todo", args=[self.todo.id]))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Todo.objects.count(), 1)


class CategoryModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")

    def test_category_creation(self):
        category = Category.objects.create(name="Home Care", user=self.user)
        self.assertEqual(category.name, "Home Care")
        self.assertEqual(category.user, self.user)

    def test_category_str_method(self):
        category = Category.objects.create(name="Job Search", user=self.user)
        self.assertEqual(str(category), "Job Search")

    def test_category_ordering(self):
        Category.objects.create(name="Zebra", user=self.user)
        Category.objects.create(name="Apple", user=self.user)
        Category.objects.create(name="Mango", user=self.user)

        categories = Category.objects.all()
        self.assertEqual(categories[0].name, "Apple")
        self.assertEqual(categories[1].name, "Mango")
        self.assertEqual(categories[2].name, "Zebra")


class TodoCategoryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.category1 = Category.objects.create(name="Home Care", user=cls.user)
        cls.category2 = Category.objects.create(name="Job Search", user=cls.user)

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()

    def test_create_todo_with_categories(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.post(
            reverse("create_todo"),
            {
                "title": "Fix the sink",
                "description": "Call plumber",
                "categories": [self.category1.id, self.category2.id],
            },
        )
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.categories.count(), 2)
        self.assertIn(self.category1, todo.categories.all())
        self.assertIn(self.category2, todo.categories.all())

    def test_create_todo_without_categories(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.post(
            reverse("create_todo"),
            {"title": "No category todo", "description": "Just a simple todo"},
        )
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.categories.count(), 0)

    def test_edit_todo_add_categories(self):
        self.client.login(username="testuser", password="testpass123")
        todo = Todo.objects.create(title="Test Todo", user=self.user)

        response = self.client.post(
            reverse("edit_todo", args=[todo.id]),
            {
                "title": "Updated Todo",
                "description": "Updated",
                "categories": [self.category1.id],
            },
        )
        self.assertEqual(response.status_code, 302)
        todo.refresh_from_db()
        self.assertEqual(todo.categories.count(), 1)
        self.assertIn(self.category1, todo.categories.all())

    def test_edit_todo_remove_categories(self):
        self.client.login(username="testuser", password="testpass123")
        todo = Todo.objects.create(title="Test Todo", user=self.user)
        todo.categories.add(self.category1, self.category2)

        response = self.client.post(
            reverse("edit_todo", args=[todo.id]),
            {"title": "Updated Todo", "description": "Updated", "categories": []},
        )
        self.assertEqual(response.status_code, 302)
        todo.refresh_from_db()
        self.assertEqual(todo.categories.count(), 0)

    def test_todo_with_multiple_categories(self):
        todo = Todo.objects.create(title="Multi-category Todo", user=self.user)
        todo.categories.add(self.category1, self.category2)

        self.assertEqual(todo.categories.count(), 2)
        category_names = [cat.name for cat in todo.categories.all()]
        self.assertIn("Home Care", category_names)
        self.assertIn("Job Search", category_names)


class CategoryFilterTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")
        cls.category1 = Category.objects.create(name="Home Care", user=cls.user)
        cls.category2 = Category.objects.create(name="Job Search", user=cls.user)

        cls.todo1 = Todo.objects.create(title="Fix sink", user=cls.user)
        cls.todo1.categories.add(cls.category1)

        cls.todo2 = Todo.objects.create(title="Apply for job", user=cls.user)
        cls.todo2.categories.add(cls.category2)

        cls.todo3 = Todo.objects.create(title="Both categories", user=cls.user)
        cls.todo3.categories.add(cls.category1, cls.category2)

        cls.todo4 = Todo.objects.create(title="No category", user=cls.user)

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()

    def test_filter_by_category(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.get(
            reverse("todo_list") + f"?category={self.category1.id}"
        )

        todos = response.context["todos"]
        self.assertEqual(len(todos), 2)
        todo_titles = [todo.title for todo in todos]
        self.assertIn("Fix sink", todo_titles)
        self.assertIn("Both categories", todo_titles)
        self.assertNotIn("Apply for job", todo_titles)
        self.assertNotIn("No category", todo_titles)

    def test_all_todos_without_filter(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.get(reverse("todo_list"))

        todos = response.context["todos"]
        self.assertEqual(len(todos), 4)

    def test_categories_in_context(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.get(reverse("todo_list"))

        self.assertIn("categories", response.context)
        categories = response.context["categories"]
        self.assertEqual(len(categories), 2)
        category_names = [cat.name for cat in categories]
        self.assertIn("Home Care", category_names)
        self.assertIn("Job Search", category_names)


class DueDateTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create shared test data that doesn't change between tests."""
        cls.user = User.objects.create_user(username="testuser", password="testpass123")

    def setUp(self):
        """Set up test client for each test."""
        self.client = Client()

    def test_create_todo_with_due_date(self):
        self.client.login(username="testuser", password="testpass123")

        response = self.client.post(
            reverse("create_todo"),
            {
                "title": "Todo with due date",
                "description": "This has a deadline",
                "due_date_date": "2025-11-25",
                "due_date_hour": "14",
            },
        )
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, "Todo with due date")
        self.assertIsNotNone(todo.due_date)
        self.assertEqual(todo.due_date.hour, 14)

    def test_create_todo_without_due_date(self):
        self.client.login(username="testuser", password="testpass123")
        response = self.client.post(
            reverse("create_todo"),
            {"title": "Todo without due date", "description": "No deadline"},
        )
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, "Todo without due date")
        self.assertIsNone(todo.due_date)

    def test_edit_todo_add_due_date(self):
        self.client.login(username="testuser", password="testpass123")
        todo = Todo.objects.create(title="Test Todo", user=self.user)
        self.assertIsNone(todo.due_date)

        response = self.client.post(
            reverse("edit_todo", args=[todo.id]),
            {
                "title": "Updated Todo",
                "description": "Updated",
                "due_date_date": "2025-11-21",
                "due_date_hour": "09",
            },
        )
        self.assertEqual(response.status_code, 302)
        todo.refresh_from_db()
        self.assertIsNotNone(todo.due_date)
        self.assertEqual(todo.due_date.hour, 9)

    def test_edit_todo_remove_due_date(self):
        from django.utils import timezone

        self.client.login(username="testuser", password="testpass123")
        due_date = timezone.now() + timezone.timedelta(days=5)
        todo = Todo.objects.create(title="Test Todo", user=self.user, due_date=due_date)
        self.assertIsNotNone(todo.due_date)

        response = self.client.post(
            reverse("edit_todo", args=[todo.id]),
            {
                "title": "Updated Todo",
                "description": "Updated",
                "due_date_date": "",
                "due_date_hour": "",
            },
        )
        self.assertEqual(response.status_code, 302)
        todo.refresh_from_db()
        self.assertIsNone(todo.due_date)

    def test_create_todo_with_date_only(self):
        self.client.login(username="testuser", password="testpass123")

        response = self.client.post(
            reverse("create_todo"),
            {
                "title": "Todo with date only",
                "description": "No specific hour",
                "due_date_date": "2025-11-30",
                "due_date_hour": "",
            },
        )
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, "Todo with date only")
        self.assertIsNotNone(todo.due_date)
        self.assertEqual(todo.due_date.hour, 0)
