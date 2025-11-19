# Troubleshooting 500 Errors on PythonAnywhere

When you get a 500 Server Error, follow these steps:

## 1. Check the Error Log

1. Log into PythonAnywhere dashboard
2. Go to Web tab
3. Scroll down to "Log files" section
4. Click on the **Error log** link
5. Look for the most recent error at the bottom of the file

The error log will show you the exact Python error that's causing the 500.

## 2. Common Issues and Fixes

### Issue: Missing SECRET_KEY or Environment Variables

**Symptom:** Error log shows `django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty.`

**Fix:**
1. Go to Web tab → Files section
2. Click on your WSGI configuration file
3. Add environment variables at the top:
```python
import os
os.environ['SECRET_KEY'] = 'your-secret-key-here'
os.environ['DEBUG'] = 'False'
os.environ['ALLOWED_HOSTS'] = 'marythought.pythonanywhere.com'
```

### Issue: Database Not Migrated

**Symptom:** Error log shows `django.db.utils.OperationalError: no such table`

**Fix:**
```bash
cd ~/ai-devtools/01-todo
source ~/venv/bin/activate
python manage.py migrate
```

### Issue: Static Files Not Collected

**Symptom:** 500 error or static files (CSS/JS) not loading

**Fix:**
```bash
cd ~/ai-devtools/01-todo
source ~/venv/bin/activate
python manage.py collectstatic --noinput
```

### Issue: Python Path Not Set Correctly

**Symptom:** Error log shows `ModuleNotFoundError: No module named 'todo_project'`

**Fix:**
1. Go to Web tab → WSGI configuration file
2. Make sure the path is correct:
```python
import sys
path = '/home/marythought/ai-devtools/01-todo'
if path not in sys.path:
    sys.path.append(path)
```

### Issue: Virtual Environment Not Activated

**Symptom:** Error log shows `ModuleNotFoundError: No module named 'django'`

**Fix:**
1. Go to Web tab
2. Check "Virtualenv" section
3. Make sure it points to: `/home/marythought/venv`
4. If not set, add it and reload the web app

### Issue: WSGI File Points to Wrong Application

**Symptom:** Various import errors

**Fix:**
1. Go to Web tab → WSGI configuration file
2. Make sure it imports the correct Django application:
```python
from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todo_project.settings')
application = get_wsgi_application()
```

## 3. Quick Diagnostic Commands

Run these in PythonAnywhere bash console to check your setup:

```bash
# Check if code is up to date
cd ~/ai-devtools/01-todo
git status

# Check if virtual environment works
source ~/venv/bin/activate
python --version
python -c "import django; print(django.VERSION)"

# Try running manage.py commands
python manage.py check
python manage.py migrate --check

# Check if settings are valid
python manage.py diffsettings
```

## 4. After Making Changes

After fixing any issues, always reload your web app:
1. Go to Web tab
2. Click the green "Reload" button at the top

## 5. Still Getting 500 Errors?

If none of the above work:

1. Copy the full error from the error log
2. Check if DEBUG is set to True temporarily (ONLY for debugging):
   - Edit WSGI file: `os.environ['DEBUG'] = 'True'`
   - Reload the app
   - Visit the site to see the detailed error page
   - **IMPORTANT**: Set DEBUG back to False when done!

## 6. Common PythonAnywhere-Specific Issues

### File Permissions
```bash
chmod -R 755 ~/ai-devtools/01-todo
```

### Database File Permissions
```bash
chmod 664 ~/ai-devtools/01-todo/db.sqlite3
```

### Check Disk Space
```bash
df -h ~
```

If disk is full, you may need to clean up old files or upgrade your PythonAnywhere account.
