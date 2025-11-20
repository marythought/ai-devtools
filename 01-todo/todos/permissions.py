"""
Custom permissions for the TODO app.

These permissions are added to Django's auth.User model via data migration.
"""

# Permission codename that will be added to User model
CAN_MODIFY_TODOS = "can_modify_todos"

# Permission display name
CAN_MODIFY_TODOS_NAME = "Can modify todos and categories"


# Helper function to check if user has modification permissions
def user_can_modify_todos(user):
    """
    Check if a user has permission to modify todos and categories.

    Args:
        user: Django User instance

    Returns:
        bool: True if user can modify todos, False otherwise (read-only/demo mode)
    """
    if not user.is_authenticated:
        return False

    return user.has_perm(f"auth.{CAN_MODIFY_TODOS}")
