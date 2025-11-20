"""
Signal handlers for the todos app.
"""

from django.contrib.auth.models import Permission, User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .permissions import CAN_MODIFY_TODOS


@receiver(post_save, sender=User)
def grant_modify_permission_to_new_users(sender, instance, created, **kwargs):
    """
    Automatically grant modify permission to newly created users.
    This ensures that regular users can modify todos by default.
    The demo user will have this permission explicitly removed.
    """
    if created and instance.username != "demo-mode":
        try:
            permission = Permission.objects.get(
                codename=CAN_MODIFY_TODOS, content_type__app_label="auth"
            )
            instance.user_permissions.add(permission)
        except Permission.DoesNotExist:
            # Permission might not exist yet during migrations
            pass
