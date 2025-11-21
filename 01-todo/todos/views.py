from datetime import datetime
from functools import wraps

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.generic import ListView

from .models import Category, Todo
from .permissions import user_can_modify_todos


def permission_required_to_modify(view_func):
    """Decorator to check if user has permission to modify todos/categories."""

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not user_can_modify_todos(request.user):
            raise PermissionDenied(
                _("You do not have permission to modify todos or categories.")
            )
        return view_func(request, *args, **kwargs)

    return wrapper


def parse_due_date(due_date_date, due_date_hour):
    """Helper function to parse due date from form inputs."""
    if not due_date_date:
        return None
    hour = int(due_date_hour) if due_date_hour else 0
    naive_dt = datetime.strptime(due_date_date, "%Y-%m-%d").replace(
        hour=hour, minute=0, second=0
    )
    return timezone.make_aware(naive_dt)


class TodoListView(LoginRequiredMixin, ListView):
    model = Todo
    template_name = "todos/todo_list.html"
    context_object_name = "todos"

    def get_queryset(self):
        queryset = Todo.objects.filter(user=self.request.user)

        # Check if viewing "Due Soon" tab
        view_mode = self.request.GET.get("view")
        if view_mode == "due_soon":
            # Show only incomplete todos with due dates, ordered by due date ascending
            queryset = queryset.filter(
                completed_at__isnull=True, due_date__isnull=False
            ).order_by("due_date")
        else:
            # Normal category filtering
            category_id = self.request.GET.get("category")
            if category_id:
                queryset = queryset.filter(categories__id=category_id)

            # Filter by completion status - save preference in session
            show_completed = self.request.GET.get("show_completed")
            if show_completed is not None:
                # User explicitly changed the setting, save to session
                self.request.session["show_completed"] = show_completed
            else:
                # Use session value, default to "true" if not set
                show_completed = self.request.session.get("show_completed", "true")

            if show_completed == "false":
                queryset = queryset.filter(completed_at__isnull=True)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["categories"] = Category.objects.filter(user=self.request.user)
        context["selected_category"] = self.request.GET.get("category")
        # Get show_completed from session, default to "true"
        context["show_completed"] = self.request.session.get("show_completed", "true")
        context["view_mode"] = self.request.GET.get("view", "default")
        return context


@login_required
def create_todo(request):
    if request.method == "POST":
        # Check permission for POST requests (actual creation)
        if not user_can_modify_todos(request.user):
            raise PermissionDenied(
                _("You do not have permission to modify todos or categories.")
            )

        title = request.POST.get("title")
        description = request.POST.get("description", "")
        category_ids = request.POST.getlist("categories")
        due_date = parse_due_date(
            request.POST.get("due_date_date"), request.POST.get("due_date_hour")
        )
        effort = request.POST.get("effort", 0)

        # Validate and sanitize effort
        try:
            effort = int(effort)
            if effort < 0:
                effort = 0
            elif effort > 10:
                effort = 10
        except (ValueError, TypeError):
            effort = 0

        if title:
            todo = Todo.objects.create(
                title=title,
                description=description,
                user=request.user,
                due_date=due_date,
                effort=effort,
            )
            if category_ids:
                todo.categories.set(category_ids)
        return redirect("todo_list")

    # Get pre-selected category IDs from URL parameters
    preselected_category_ids = request.GET.getlist("category")
    preselected_category_ids = [
        int(cat_id) for cat_id in preselected_category_ids if cat_id.isdigit()
    ]

    categories = Category.objects.filter(user=request.user)
    return render(
        request,
        "todos/create_todo.html",
        {
            "categories": categories,
            "preselected_category_ids": preselected_category_ids,
        },
    )


@login_required
def toggle_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if todo.completed_at:
        todo.completed_at = None
    else:
        todo.completed_at = timezone.now()
    todo.save()
    return redirect("todo_list")


@login_required
@permission_required_to_modify
def complete_and_followup(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)

    if request.method == "POST":
        # Mark the todo as completed
        todo.completed_at = timezone.now()
        todo.save()

        # Get the category IDs from the completed todo
        category_ids = list(todo.categories.values_list("id", flat=True))

        # Redirect to create_todo with category pre-selected
        if category_ids:
            category_params = "&".join(
                [f"category={cat_id}" for cat_id in category_ids]
            )
            return redirect(f"/create/?{category_params}")
        else:
            return redirect("create_todo")

    return redirect("todo_list")


@login_required
def edit_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if request.method == "POST":
        # Check permission for POST requests (actual editing)
        if not user_can_modify_todos(request.user):
            raise PermissionDenied(
                _("You do not have permission to modify todos or categories.")
            )

        title = request.POST.get("title")
        description = request.POST.get("description", "")
        category_ids = request.POST.getlist("categories")
        due_date = parse_due_date(
            request.POST.get("due_date_date"), request.POST.get("due_date_hour")
        )
        effort = request.POST.get("effort", 0)

        # Validate and sanitize effort
        try:
            effort = int(effort)
            if effort < 0:
                effort = 0
            elif effort > 10:
                effort = 10
        except (ValueError, TypeError):
            effort = 0

        if title:
            todo.title = title
            todo.description = description
            todo.due_date = due_date
            todo.effort = effort
            todo.save()
            todo.categories.set(category_ids)
        return redirect("todo_list")
    categories = Category.objects.filter(user=request.user)
    return render(
        request, "todos/edit_todo.html", {"todo": todo, "categories": categories}
    )


@login_required
@permission_required_to_modify
def delete_todo(request, todo_id):
    todo = get_object_or_404(Todo, id=todo_id, user=request.user)
    if request.method == "POST":
        todo.delete()
    return redirect("todo_list")


def handle_reorder_request(request, id_key, queryset_filter):
    """Generic handler for reordering items."""
    import json

    if request.method != "POST":
        return JsonResponse({"status": "error"}, status=400)

    try:
        data = json.loads(request.body)
        item_ids = data.get(id_key, [])

        for index, item_id in enumerate(item_ids):
            queryset_filter(item_id).update(order=index)

        return JsonResponse({"status": "success"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


@login_required
def reorder_todos(request):
    if request.method == "POST":
        import json

        try:
            data = json.loads(request.body)
            todo_ids = data.get("todo_ids", [])

            # Get all todos to check completion status
            todos = {
                todo.id: todo
                for todo in Todo.objects.filter(id__in=todo_ids, user=request.user)
            }

            # Validate that incomplete items aren't being placed after completed items
            completed_seen = False
            for todo_id in todo_ids:
                todo = todos.get(todo_id)
                if todo:
                    if todo.is_completed:
                        completed_seen = True
                    elif completed_seen:
                        return JsonResponse(
                            {
                                "status": "error",
                                "message": _(
                                    "Cannot place incomplete items after completed items"
                                ),
                            },
                            status=400,
                        )

            # Update order for all todos
            for index, todo_id in enumerate(todo_ids):
                todo = todos.get(todo_id)
                if todo:
                    todo.order = index
                    todo.save()

            return JsonResponse({"status": "success"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
    return JsonResponse({"status": "error"}, status=400)


@login_required
def manage_categories(request):
    if request.method == "POST":
        # Check permission for POST requests (actual creation)
        if not user_can_modify_todos(request.user):
            raise PermissionDenied(
                _("You do not have permission to modify todos or categories.")
            )

        name = request.POST.get("name")
        if name:
            Category.objects.create(name=name, user=request.user)
        return redirect("manage_categories")
    categories = Category.objects.filter(user=request.user)
    return render(request, "todos/manage_categories.html", {"categories": categories})


@login_required
@permission_required_to_modify
def delete_category(request, category_id):
    category = get_object_or_404(Category, id=category_id, user=request.user)
    if request.method == "POST":
        category.delete()
    return redirect("manage_categories")


@login_required
def reorder_categories(request):
    return handle_reorder_request(
        request,
        "category_ids",
        lambda cat_id: Category.objects.filter(id=cat_id, user=request.user),
    )


def about_site(request):
    """View for the About this Site page."""
    return render(request, "todos/about_site.html")


def about_spoons(request):
    """View for the What's with the spoons? page."""
    return render(request, "todos/about_spoons.html")
