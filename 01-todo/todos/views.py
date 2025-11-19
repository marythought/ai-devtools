from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Todo, Category


class TodoListView(LoginRequiredMixin, ListView):
    model = Todo
    template_name = 'todos/todo_list.html'
    context_object_name = 'todos'

    def get_queryset(self):
        queryset = Todo.objects.filter(user=self.request.user)

        # Check if viewing "Due Soon" tab
        view_mode = self.request.GET.get('view')
        if view_mode == 'due_soon':
            # Show only incomplete todos with due dates, ordered by due date ascending
            queryset = queryset.filter(completed_at__isnull=True, due_date__isnull=False).order_by('due_date')
        else:
            # Normal category filtering
            category_id = self.request.GET.get('category')
            if category_id:
                queryset = queryset.filter(categories__id=category_id)

            # Filter by completion status
            show_completed = self.request.GET.get('show_completed', 'true')
            if show_completed == 'false':
                queryset = queryset.filter(completed_at__isnull=True)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.filter(user=self.request.user)
        context['selected_category'] = self.request.GET.get('category')
        context['show_completed'] = self.request.GET.get('show_completed', 'true')
        context['view_mode'] = self.request.GET.get('view', 'default')
        return context


@login_required
def create_todo(request):
    if request.method == 'POST':
        from django.utils import timezone
        from datetime import datetime
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        category_ids = request.POST.getlist('categories')
        due_date_date = request.POST.get('due_date_date')
        due_date_hour = request.POST.get('due_date_hour')

        due_date = None
        if due_date_date:
            hour = int(due_date_hour) if due_date_hour else 0
            naive_dt = datetime.strptime(due_date_date, '%Y-%m-%d').replace(hour=hour, minute=0, second=0)
            due_date = timezone.make_aware(naive_dt)

        if title:
            todo = Todo.objects.create(title=title, description=description, user=request.user, due_date=due_date)
            if category_ids:
                todo.categories.set(category_ids)
        return redirect('todo_list')

    # Get pre-selected category IDs from URL parameters
    preselected_category_ids = request.GET.getlist('category')
    preselected_category_ids = [int(cat_id) for cat_id in preselected_category_ids if cat_id.isdigit()]

    categories = Category.objects.filter(user=request.user)
    return render(request, 'todos/create_todo.html', {
        'categories': categories,
        'preselected_category_ids': preselected_category_ids
    })


@login_required
def toggle_todo(request, todo_id):
    from django.utils import timezone
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if todo.completed_at:
        todo.completed_at = None
    else:
        todo.completed_at = timezone.now()
    todo.save()
    return redirect('todo_list')


@login_required
def complete_and_followup(request, todo_id):
    from django.utils import timezone
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)

    if request.method == 'POST':
        # Mark the todo as completed
        todo.completed_at = timezone.now()
        todo.save()

        # Get the category IDs from the completed todo
        category_ids = list(todo.categories.values_list('id', flat=True))

        # Redirect to create_todo with category pre-selected
        if category_ids:
            category_params = '&'.join([f'category={cat_id}' for cat_id in category_ids])
            return redirect(f"/create/?{category_params}")
        else:
            return redirect('create_todo')

    return redirect('todo_list')


@login_required
def edit_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if request.method == 'POST':
        from django.utils import timezone
        from datetime import datetime
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        category_ids = request.POST.getlist('categories')
        due_date_date = request.POST.get('due_date_date')
        due_date_hour = request.POST.get('due_date_hour')

        due_date = None
        if due_date_date:
            hour = int(due_date_hour) if due_date_hour else 0
            naive_dt = datetime.strptime(due_date_date, '%Y-%m-%d').replace(hour=hour, minute=0, second=0)
            due_date = timezone.make_aware(naive_dt)

        if title:
            todo.title = title
            todo.description = description
            todo.due_date = due_date
            todo.save()
            todo.categories.set(category_ids)
        return redirect('todo_list')
    categories = Category.objects.filter(user=request.user)
    return render(request, 'todos/edit_todo.html', {'todo': todo, 'categories': categories})


@login_required
def delete_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if request.method == 'POST':
        todo.delete()
    return redirect('todo_list')


@login_required
def reorder_todos(request):
    if request.method == 'POST':
        import json
        from django.http import JsonResponse
        try:
            data = json.loads(request.body)
            todo_ids = data.get('todo_ids', [])

            # Get all todos to check completion status
            todos = {todo.id: todo for todo in Todo.objects.filter(id__in=todo_ids, user=request.user)}

            # Validate that incomplete items aren't being placed after completed items
            completed_seen = False
            for todo_id in todo_ids:
                todo = todos.get(todo_id)
                if todo:
                    if todo.is_completed:
                        completed_seen = True
                    elif completed_seen:
                        return JsonResponse({'status': 'error', 'message': 'Cannot place incomplete items after completed items'}, status=400)

            # Update order for all todos
            for index, todo_id in enumerate(todo_ids):
                todo = todos.get(todo_id)
                if todo:
                    todo.order = index
                    todo.save()

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error'}, status=400)


@login_required
def manage_categories(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        if name:
            Category.objects.create(name=name, user=request.user)
        return redirect('manage_categories')
    categories = Category.objects.filter(user=request.user)
    return render(request, 'todos/manage_categories.html', {'categories': categories})


@login_required
def delete_category(request, category_id):
    category = get_object_or_404(Category, id=category_id, user=request.user)
    if request.method == 'POST':
        category.delete()
    return redirect('manage_categories')


@login_required
def reorder_categories(request):
    if request.method == 'POST':
        import json
        from django.http import JsonResponse
        try:
            data = json.loads(request.body)
            category_ids = data.get('category_ids', [])

            for index, category_id in enumerate(category_ids):
                category = Category.objects.get(id=category_id, user=request.user)
                category.order = index
                category.save()

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error'}, status=400)
