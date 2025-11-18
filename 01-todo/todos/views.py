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
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        category_ids = request.POST.getlist('categories')
        if title:
            todo = Todo.objects.create(title=title, description=description, user=request.user)
            if category_ids:
                todo.categories.set(category_ids)
        return redirect('todo_list')
    categories = Category.objects.filter(user=request.user)
    return render(request, 'todos/create_todo.html', {'categories': categories})


@login_required
def toggle_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    todo.completed = not todo.completed
    todo.save()
    return redirect('todo_list')


@login_required
def edit_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        category_ids = request.POST.getlist('categories')
        if title:
            todo.title = title
            todo.description = description
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
