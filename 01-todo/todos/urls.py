from django.urls import path

from . import auth_views, views, webhook_views

urlpatterns = [
    path("", views.TodoListView.as_view(), name="todo_list"),
    path("create/", views.create_todo, name="create_todo"),
    path("edit/<int:todo_id>/", views.edit_todo, name="edit_todo"),
    path("toggle/<int:todo_id>/", views.toggle_todo, name="toggle_todo"),
    path(
        "complete-followup/<int:todo_id>/",
        views.complete_and_followup,
        name="complete_and_followup",
    ),
    path("delete/<int:todo_id>/", views.delete_todo, name="delete_todo"),
    path("reorder/", views.reorder_todos, name="reorder_todos"),
    path("categories/", views.manage_categories, name="manage_categories"),
    path("categories/delete/<int:category_id>/", views.delete_category, name="delete_category"),
    path("categories/reorder/", views.reorder_categories, name="reorder_categories"),
    path("register/", auth_views.register_view, name="register"),
    path("login/", auth_views.login_view, name="login"),
    path("logout/", auth_views.logout_view, name="logout"),
    path("webhook/github/", webhook_views.github_webhook, name="github_webhook"),
]
