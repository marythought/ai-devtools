"""
Pre-filled WSGI snippet for PythonAnywhere deployment for user `marythought`.

Place (or copy) this content into the WSGI configuration file provided by PythonAnywhere
for your web app, or use it as a reference. Paths assume you clone your repo to
`/home/marythought/ai-devtools` on PythonAnywhere.

Python version: 3.9
"""
import os
import sys

# Path to your project (directory that contains manage.py)
project_home = '/home/marythought/ai-devtools/01-todo'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# If your project uses a different top-level package name, adjust accordingly.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todo_project.settings')

# Optionally set environment variables here. Recommended: set them via the
# PythonAnywhere Web tab (Environment variables) instead of hardcoding.
# os.environ['DJANGO_SECRET_KEY'] = 'replace-with-secret'
# os.environ['DJANGO_DEBUG'] = 'False'
# os.environ['DJANGO_ALLOWED_HOSTS'] = 'marythought.pythonanywhere.com'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
