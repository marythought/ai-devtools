from django.apps import AppConfig


class TodosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "todos"

    def ready(self):
        """Import signal handlers when the app is ready."""
        import todos.signals  # noqa: F401
