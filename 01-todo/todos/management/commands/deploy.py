import subprocess
import sys

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Deploy the application (git pull, migrate, collectstatic)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-git",
            action="store_true",
            help="Skip git pull step",
        )

    def handle(self, *args, **options):
        skip_git = options.get("skip_git", False)

        try:
            # Git pull
            if not skip_git:
                self.stdout.write("Pulling latest code from GitHub...")
                result = subprocess.run(
                    ["git", "pull", "origin", "main"],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                self.stdout.write(self.style.SUCCESS(result.stdout))

            # Install/update dependencies
            self.stdout.write("Installing dependencies...")
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                capture_output=True,
                text=True,
                check=True,
            )
            self.stdout.write(self.style.SUCCESS("Dependencies installed"))

            # Run migrations
            self.stdout.write("Running migrations...")
            from django.core.management import call_command

            call_command("migrate", verbosity=0)
            self.stdout.write(self.style.SUCCESS("Migrations complete"))

            # Collect static files
            self.stdout.write("Collecting static files...")
            call_command("collectstatic", interactive=False, verbosity=0)
            self.stdout.write(self.style.SUCCESS("Static files collected"))

            self.stdout.write(self.style.SUCCESS("\n✅ Deployment completed successfully!"))

        except subprocess.CalledProcessError as e:
            self.stdout.write(self.style.ERROR(f"❌ Deployment failed during: {e.cmd}"))
            self.stdout.write(self.style.ERROR(f"Error: {e.stderr}"))
            raise
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Deployment failed: {str(e)}"))
            raise
