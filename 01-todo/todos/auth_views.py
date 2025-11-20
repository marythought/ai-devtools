from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from django.shortcuts import redirect, render


def register_view(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful!")
            return redirect("todo_list")
        else:
            messages.error(request, "Registration failed. Please correct the errors.")
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
                messages.success(request, f"Welcome back, {username}!")
                return redirect("todo_list")
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()
    return render(request, "todos/login.html", {"form": form})


def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
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
            "Welcome to Demo Mode! You have read-only access. "
            "You can view all features but cannot create, edit, or delete items.",
        )
        return redirect("todo_list")
    except User.DoesNotExist:
        messages.error(
            request,
            "Demo mode is not available. Please contact the administrator.",
        )
        return redirect("login")
