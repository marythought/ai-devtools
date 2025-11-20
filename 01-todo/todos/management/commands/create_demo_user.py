"""
Management command to create or update the demo user.

This command:
1. Creates a user with username "demo-mode" (or gets existing)
2. Sets a secure password
3. Removes the can_modify_todos permission (read-only access)
4. Optionally creates sample todos and categories for demo purposes
"""

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from todos.models import Category, Todo
from todos.permissions import CAN_MODIFY_TODOS


class Command(BaseCommand):
    help = "Create or update the demo user with read-only permissions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-sample-data",
            action="store_true",
            help="Create sample todos and categories for the demo user",
        )

    def handle(self, *args, **options):
        # Create or get demo user
        demo_user, created = User.objects.get_or_create(
            username="demo-mode",
            defaults={
                "first_name": "Demo",
                "last_name": "User",
                "email": "demo@example.com",
            },
        )

        # Set password (same for all demo users for consistency)
        demo_user.set_password("demo1234")
        demo_user.save()

        # Remove modify permission to make user read-only
        perm_name = f"auth.{CAN_MODIFY_TODOS}"
        if demo_user.has_perm(perm_name):
            # Remove the permission
            from django.contrib.auth.models import Permission

            permission = Permission.objects.get(
                codename=CAN_MODIFY_TODOS, content_type__app_label="auth"
            )
            demo_user.user_permissions.remove(permission)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Removed modify permission from {demo_user.username}"
                )
            )

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} demo user: {demo_user.username}")
        )

        # Create sample data if requested
        if options["with_sample_data"]:
            self._create_sample_data(demo_user)

    def _create_sample_data(self, user):
        """Create sample categories and todos for the demo user."""
        # Create categories
        work_cat, _ = Category.objects.get_or_create(
            name="Work", user=user, defaults={"order": 1}
        )
        personal_cat, _ = Category.objects.get_or_create(
            name="Personal", user=user, defaults={"order": 2}
        )
        learning_cat, _ = Category.objects.get_or_create(
            name="Learning", user=user, defaults={"order": 3}
        )

        # Create sample todos
        todo1, created1 = Todo.objects.get_or_create(
            title="Review quarterly report",
            user=user,
            defaults={
                "description": "Analyze Q4 performance metrics and prepare summary",
                "effort": 7,
                "order": 1,
            },
        )
        if created1:
            todo1.categories.add(work_cat)

        todo2, created2 = Todo.objects.get_or_create(
            title="Schedule team meeting",
            user=user,
            defaults={
                "description": "Coordinate with team for next sprint planning",
                "effort": 0,
                "order": 2,
            },
        )
        if created2:
            todo2.categories.add(work_cat)

        todo3, created3 = Todo.objects.get_or_create(
            title="Update project documentation",
            user=user,
            defaults={
                "description": "Document new API endpoints and usage examples",
                "effort": 5,
                "order": 3,
                "completed_at": timezone.now(),
            },
        )
        if created3:
            todo3.categories.add(work_cat, learning_cat)

        todo4, created4 = Todo.objects.get_or_create(
            title="Grocery shopping",
            user=user,
            defaults={
                "description": "Buy ingredients for weekend meal prep",
                "effort": 4,
                "order": 4,
            },
        )
        if created4:
            todo4.categories.add(personal_cat)

        todo5, created5 = Todo.objects.get_or_create(
            title="Learn Django permissions system",
            user=user,
            defaults={
                "description": "Deep dive into Django's built-in permissions and groups",
                "effort": 8,
                "order": 5,
            },
        )
        if created5:
            todo5.categories.add(learning_cat)

        todo6, created6 = Todo.objects.get_or_create(
            title="Update resume",
            user=user,
            defaults={
                "description": "",
                "effort": 8,
                "order": 5,
            },
        )
        if created6:
            todo6.categories.add(work_cat)

        sample_count = sum([created1, created2, created3, created4, created5])
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {sample_count} sample todos and {3} categories for demo user"
            )
        )
