from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.utils.translation import gettext_lazy as _


def register_view(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, _("Registration successful!"))
            return redirect("todo_list")
        else:
            messages.error(request, _("Registration failed. Please correct the errors."))
    else:
        form = UserCreationForm()
    return render(request, "todos/register.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, _("Welcome back, %(username)s!") % {"username": username})
                return redirect("todo_list")
        else:
            messages.error(request, _("Invalid username or password."))
    else:
        form = AuthenticationForm()
    return render(request, "todos/login.html", {"form": form})


def logout_view(request):
    logout(request)
    messages.info(request, _("You have been logged out."))
    return redirect("login")


def demo_login(request):
    """
    Log in the demo user automatically.
    The demo user has read-only access (no can_modify_todos permission).
    """
    try:
        demo_user = User.objects.get(username="demo-mode")
        login(request, demo_user, backend="django.contrib.auth.backends.ModelBackend")
        messages.info(
            request,
            _(
                "Welcome to Demo Mode! "
                "You can view todos, mark them complete/incomplete, and reorder items. "
                "However, you cannot create, edit, or delete items."
            ),
        )
        return redirect("todo_list")
    except User.DoesNotExist:
        messages.error(
            request,
            _("Demo mode is not available. Please contact the administrator."),
        )
        return redirect("login")
