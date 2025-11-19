# PythonAnywhere Static Files Configuration

## Problem
Static files (CSS, JavaScript) not loading in production on PythonAnywhere.

## Root Cause
When `DEBUG=False`, Django does not serve static files. PythonAnywhere's web server must be configured to serve them directly.

## Solution

### Step 1: Verify collectstatic runs in deployment
The deploy workflow already runs `collectstatic`:
```bash
python manage.py collectstatic --noinput
```

This collects all static files to: `/home/YOUR_USERNAME/ai-devtools/01-todo/staticfiles/`

### Step 2: Configure PythonAnywhere Static Files Mapping

1. Go to PythonAnywhere Dashboard
2. Click on **Web** tab
3. Scroll down to **Static files** section
4. Click **"Enter URL"** and **"Enter path"**

Add this mapping:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/YOUR_USERNAME/ai-devtools/01-todo/staticfiles/` |

Replace `YOUR_USERNAME` with your actual PythonAnywhere username.

### Step 3: Reload the web app
Click the green **"Reload"** button at the top of the Web tab.

## Verification

After configuration, your static files should be accessible at:
- CSS: `https://YOUR_DOMAIN/static/todos/css/todo-list.css`
- JS: `https://YOUR_DOMAIN/static/todos/js/todo-list.js`

## Current Static Files Structure

```
01-todo/
├── staticfiles/              # Collected static files (created by collectstatic)
│   ├── admin/               # Django admin static files
│   └── todos/
│       ├── css/
│       │   └── todo-list.css
│       └── js/
│           ├── todo-list.js
│           └── manage-categories.js
└── todos/
    └── static/              # Source static files
        └── todos/
            ├── css/
            │   └── todo-list.css
            └── js/
                ├── todo-list.js
                └── manage-categories.js
```

## Settings Reference

From `settings.py`:
```python
STATIC_URL = "static/"                    # URL prefix
STATIC_ROOT = BASE_DIR / "staticfiles"   # Collection directory
```

## Troubleshooting

### Static files still not loading?

1. **Check the path is correct:**
   ```bash
   ls -la /home/YOUR_USERNAME/ai-devtools/01-todo/staticfiles/todos/
   ```

2. **Verify collectstatic ran:**
   ```bash
   cd /home/YOUR_USERNAME/ai-devtools/01-todo
   python manage.py collectstatic --noinput --dry-run
   ```

3. **Check browser console for 404 errors:**
   - Open browser developer tools (F12)
   - Look at Network tab
   - See what URLs are being requested

4. **Common mistakes:**
   - Trailing slash missing: Use `/static/` not `/static`
   - Wrong path: Ensure path points to `staticfiles` not `static`
   - Username incorrect: Double-check your PythonAnywhere username

## Why This Happens

In development (`DEBUG=True`):
- Django's `runserver` automatically serves static files
- No configuration needed

In production (`DEBUG=False`):
- Django doesn't serve static files for security/performance
- Web server (nginx on PythonAnywhere) must serve them
- Requires explicit configuration in PythonAnywhere Web tab
