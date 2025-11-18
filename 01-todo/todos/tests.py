from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Todo


class TodoModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_todo_creation(self):
        todo = Todo.objects.create(
            title='Test Todo',
            description='Test Description',
            user=self.user
        )
        self.assertEqual(todo.title, 'Test Todo')
        self.assertEqual(todo.description, 'Test Description')
        self.assertEqual(todo.user, self.user)
        self.assertFalse(todo.completed)

    def test_todo_str_method(self):
        todo = Todo.objects.create(title='My Todo', user=self.user)
        self.assertEqual(str(todo), 'My Todo')

    def test_todo_ordering(self):
        todo1 = Todo.objects.create(title='Incomplete', completed=False, user=self.user)
        todo2 = Todo.objects.create(title='Completed', completed=True, user=self.user)
        todo3 = Todo.objects.create(title='Also Incomplete', completed=False, user=self.user)

        todos = Todo.objects.all()
        self.assertEqual(todos[0].completed, False)
        self.assertEqual(todos[1].completed, False)
        self.assertEqual(todos[2].completed, True)


class TodoListViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass123')

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 302)

    def test_view_url_accessible_when_logged_in(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 200)

    def test_view_uses_correct_template(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('todo_list'))
        self.assertTemplateUsed(response, 'todos/todo_list.html')

    def test_only_shows_user_todos(self):
        self.client.login(username='testuser', password='testpass123')
        Todo.objects.create(title='My Todo', user=self.user)
        Todo.objects.create(title='Other User Todo', user=self.other_user)

        response = self.client.get(reverse('todo_list'))
        self.assertEqual(len(response.context['todos']), 1)
        self.assertEqual(response.context['todos'][0].title, 'My Todo')


class CreateTodoViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse('create_todo'))
        self.assertEqual(response.status_code, 302)

    def test_create_todo_with_valid_data(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('create_todo'), {
            'title': 'New Todo',
            'description': 'New Description'
        })
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Todo.objects.count(), 1)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, 'New Todo')
        self.assertEqual(todo.description, 'New Description')
        self.assertEqual(todo.user, self.user)

    def test_create_todo_without_title(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('create_todo'), {
            'description': 'No Title'
        })
        self.assertEqual(Todo.objects.count(), 0)


class EditTodoViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass123')
        self.todo = Todo.objects.create(title='Original Title', description='Original Description', user=self.user)

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse('edit_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)

    def test_edit_todo_get_request(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('edit_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/edit_todo.html')
        self.assertEqual(response.context['todo'], self.todo)

    def test_edit_todo_post_request(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('edit_todo', args=[self.todo.id]), {
            'title': 'Updated Title',
            'description': 'Updated Description'
        })
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'Updated Title')
        self.assertEqual(self.todo.description, 'Updated Description')

    def test_cannot_edit_other_user_todo(self):
        self.client.login(username='otheruser', password='testpass123')
        response = self.client.get(reverse('edit_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 404)


class ToggleTodoViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.todo = Todo.objects.create(title='Test Todo', completed=False, user=self.user)

    def test_redirect_if_not_logged_in(self):
        response = self.client.post(reverse('toggle_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)

    def test_toggle_todo_completion(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('toggle_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertTrue(self.todo.completed)

        response = self.client.post(reverse('toggle_todo', args=[self.todo.id]))
        self.todo.refresh_from_db()
        self.assertFalse(self.todo.completed)


class DeleteTodoViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass123')
        self.todo = Todo.objects.create(title='Test Todo', user=self.user)

    def test_redirect_if_not_logged_in(self):
        response = self.client.post(reverse('delete_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)

    def test_delete_todo(self):
        self.client.login(username='testuser', password='testpass123')
        self.assertEqual(Todo.objects.count(), 1)
        response = self.client.post(reverse('delete_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Todo.objects.count(), 0)

    def test_cannot_delete_other_user_todo(self):
        self.client.login(username='otheruser', password='testpass123')
        response = self.client.post(reverse('delete_todo', args=[self.todo.id]))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Todo.objects.count(), 1)
