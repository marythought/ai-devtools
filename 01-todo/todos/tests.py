from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Todo, Category


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


class CategoryModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_category_creation(self):
        category = Category.objects.create(name='Home Care', user=self.user)
        self.assertEqual(category.name, 'Home Care')
        self.assertEqual(category.user, self.user)

    def test_category_str_method(self):
        category = Category.objects.create(name='Job Search', user=self.user)
        self.assertEqual(str(category), 'Job Search')

    def test_category_ordering(self):
        Category.objects.create(name='Zebra', user=self.user)
        Category.objects.create(name='Apple', user=self.user)
        Category.objects.create(name='Mango', user=self.user)

        categories = Category.objects.all()
        self.assertEqual(categories[0].name, 'Apple')
        self.assertEqual(categories[1].name, 'Mango')
        self.assertEqual(categories[2].name, 'Zebra')


class TodoCategoryTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.category1 = Category.objects.create(name='Home Care', user=self.user)
        self.category2 = Category.objects.create(name='Job Search', user=self.user)

    def test_create_todo_with_categories(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('create_todo'), {
            'title': 'Fix the sink',
            'description': 'Call plumber',
            'categories': [self.category1.id, self.category2.id]
        })
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.categories.count(), 2)
        self.assertIn(self.category1, todo.categories.all())
        self.assertIn(self.category2, todo.categories.all())

    def test_create_todo_without_categories(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.post(reverse('create_todo'), {
            'title': 'No category todo',
            'description': 'Just a simple todo'
        })
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.first()
        self.assertEqual(todo.categories.count(), 0)

    def test_edit_todo_add_categories(self):
        self.client.login(username='testuser', password='testpass123')
        todo = Todo.objects.create(title='Test Todo', user=self.user)

        response = self.client.post(reverse('edit_todo', args=[todo.id]), {
            'title': 'Updated Todo',
            'description': 'Updated',
            'categories': [self.category1.id]
        })
        self.assertEqual(response.status_code, 302)
        todo.refresh_from_db()
        self.assertEqual(todo.categories.count(), 1)
        self.assertIn(self.category1, todo.categories.all())

    def test_edit_todo_remove_categories(self):
        self.client.login(username='testuser', password='testpass123')
        todo = Todo.objects.create(title='Test Todo', user=self.user)
        todo.categories.add(self.category1, self.category2)

        response = self.client.post(reverse('edit_todo', args=[todo.id]), {
            'title': 'Updated Todo',
            'description': 'Updated',
            'categories': []
        })
        self.assertEqual(response.status_code, 302)
        todo.refresh_from_db()
        self.assertEqual(todo.categories.count(), 0)

    def test_todo_with_multiple_categories(self):
        todo = Todo.objects.create(title='Multi-category Todo', user=self.user)
        todo.categories.add(self.category1, self.category2)

        self.assertEqual(todo.categories.count(), 2)
        category_names = [cat.name for cat in todo.categories.all()]
        self.assertIn('Home Care', category_names)
        self.assertIn('Job Search', category_names)


class CategoryFilterTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.category1 = Category.objects.create(name='Home Care', user=self.user)
        self.category2 = Category.objects.create(name='Job Search', user=self.user)

        self.todo1 = Todo.objects.create(title='Fix sink', user=self.user)
        self.todo1.categories.add(self.category1)

        self.todo2 = Todo.objects.create(title='Apply for job', user=self.user)
        self.todo2.categories.add(self.category2)

        self.todo3 = Todo.objects.create(title='Both categories', user=self.user)
        self.todo3.categories.add(self.category1, self.category2)

        self.todo4 = Todo.objects.create(title='No category', user=self.user)

    def test_filter_by_category(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('todo_list') + f'?category={self.category1.id}')

        todos = response.context['todos']
        self.assertEqual(len(todos), 2)
        todo_titles = [todo.title for todo in todos]
        self.assertIn('Fix sink', todo_titles)
        self.assertIn('Both categories', todo_titles)
        self.assertNotIn('Apply for job', todo_titles)
        self.assertNotIn('No category', todo_titles)

    def test_all_todos_without_filter(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('todo_list'))

        todos = response.context['todos']
        self.assertEqual(len(todos), 4)

    def test_categories_in_context(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('todo_list'))

        self.assertIn('categories', response.context)
        categories = response.context['categories']
        self.assertEqual(len(categories), 2)
        category_names = [cat.name for cat in categories]
        self.assertIn('Home Care', category_names)
        self.assertIn('Job Search', category_names)
