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
        category_id = self.request.GET.get('category')
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.filter(user=self.request.user)
        context['selected_category'] = self.request.GET.get('category')
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
    categories = Category.objects.filter(user=request.user)
    return render(request, 'todos/create_todo.html', {'categories': categories})


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
