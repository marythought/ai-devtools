# Deploying this Django app to PythonAnywhere

This document describes a minimal, repeatable process to deploy the `01-todo` Django app to PythonAnywhere.

Prerequisites
- A PythonAnywhere account
- Your project code available on PythonAnywhere (clone from GitHub or upload files)
- A virtualenv on PythonAnywhere matching the Python version you choose

Quick steps

1. Push or upload code to PythonAnywhere
   - Recommended: push to GitHub and `git clone` on PythonAnywhere.

2. Create and activate a virtualenv (example uses Python 3.10)
```bash
cd ~
python3.10 -m venv ~/venv-todo
source ~/venv-todo/bin/activate
cd ~/yourrepo/01-todo
pip install --upgrade pip
pip install -r requirements.txt
```

3. Configure the PythonAnywhere Web app
- In the PythonAnywhere Dashboard → Web tab, create a new web app (Manual configuration).
- Set the **Source code** directory to your project path, e.g. `/home/<yourusername>/yourrepo/01-todo`.
- Set the **Virtualenv** field to `/home/<yourusername>/venv-todo`.
- In the **Environment variables** section, add the following (adjust values):
```
DJANGO_SECRET_KEY=replace-with-your-secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=<yourusername>.pythonanywhere.com
```

4. WSGI configuration
- Edit the WSGI file from the Web tab and replace or add the following (update paths):

```python
import os
import sys

# Path to your project (directory that contains manage.py)
project_home = '/home/<yourusername>/yourrepo/01-todo'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todo_project.settings')

# Optionally set env vars here if you prefer (or use the Web tab Environment variables)
# os.environ['DJANGO_SECRET_KEY'] = 'replace-with-secret'
# os.environ['DJANGO_DEBUG'] = 'False'
# os.environ['DJANGO_ALLOWED_HOSTS'] = '<yourusername>.pythonanywhere.com'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

5. Run migrations, collectstatic, and create a superuser
```bash
source ~/venv-todo/bin/activate
cd ~/yourrepo/01-todo
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

6. Static files mapping (PythonAnywhere Web tab)
- Add a static files mapping:
  - URL: `/static/`
  - Directory: `/home/<yourusername>/yourrepo/01-todo/staticfiles`

7. Reload your web app (Web tab → Reload)

Notes & tips
- The project uses SQLite by default (`db.sqlite3`). For production or multi-user apps consider a managed database.
- `STATIC_ROOT` is set to `staticfiles` in `todo_project/settings.py` to support `collectstatic` on PythonAnywhere.
- You can use PythonAnywhere's static-file serving or `whitenoise` (included in `requirements.txt`) depending on preference.
- If you keep the local `db.sqlite3`, upload it to `01-todo/` before running migrations.

If you'd like, I can also:
- Create a pre-filled WSGI file tailored to your PythonAnywhere username and Python version.
- Commit and push these changes to GitHub for you (I will need push access or you can push locally).

Files changed/added in this repo for deployment support:
- `01-todo/todo_project/settings.py` — reads secret/settings from env and sets `STATIC_ROOT`.
- `01-todo/requirements.txt` — minimal dependencies (Django + whitenoise).
- `01-todo/.env.example` — example environment variables.
- `01-todo/README_DEPLOY_PYTHONANYWHERE.md` — this file.

---
If you want me to tailor the WSGI file and env vars for your PythonAnywhere username, tell me the username and preferred Python version (e.g. `3.10`, `3.11`).
