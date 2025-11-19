# Quick Start: Automatic Deployment

You now have a GitHub webhook system set up! Here's what you need to do to activate it:

## Current Status

✅ Webhook code deployed to GitHub
✅ GitHub Actions runs tests automatically
⏳ Webhook needs to be configured on PythonAnywhere
⏳ Webhook needs to be added to GitHub repository

## What You Need To Do (5 minutes)

### Step 1: Fix the Current 500 Error

First, run the migration on PythonAnywhere:

```bash
cd ~/ai-devtools/01-todo
source ~/.virtualenvs/ai-devtools/bin/activate
python manage.py migrate
```

Then reload your web app from the Web tab. This will fix the current 500 error.

### Step 2: Pull the Webhook Code

```bash
cd ~/ai-devtools/01-todo
git pull origin main
```

### Step 3: Generate a Webhook Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Save the output - you'll need it for the next steps.

### Step 4: Configure the Secret in PythonAnywhere

1. Go to PythonAnywhere Web tab
2. Click on your WSGI configuration file
3. Add this line near the top:

```python
import os
os.environ['GITHUB_WEBHOOK_SECRET'] = 'paste-your-secret-here'
```

4. Click Save
5. Reload your web app

### Step 5: Add Webhook in GitHub

1. Go to: https://github.com/marythought/ai-devtools/settings/hooks
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `https://marythought.pythonanywhere.com/webhook/github/`
   - **Content type**: `application/json`
   - **Secret**: (paste the secret from Step 3)
   - **Events**: Just the push event
   - **Active**: ✅ Checked
4. Click "Add webhook"

### Step 6: Test It!

Make a small change and push:

```bash
# On your local machine
echo "# Test" >> README.md
git add README.md
git commit -m "test automatic deployment"
git push origin main
```

Within seconds:
- ✅ GitHub Actions will run tests
- ✅ GitHub will send a webhook to your app
- ✅ Your app will automatically deploy the new code
- ✅ PythonAnywhere will reload with the changes

## Verify It Worked

1. **Check GitHub Webhook**: Go to Settings → Webhooks → Recent Deliveries
   - Should show a green ✅ with 200 response

2. **Check PythonAnywhere**: Visit your site
   - Should have the new changes

3. **Check Server Log**: PythonAnywhere Web tab → Server log
   - Should show deployment activity

## Need Help?

See the detailed guides:
- 📖 [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) - Complete webhook setup guide
- 📖 [DEPLOYMENT.md](DEPLOYMENT.md) - General deployment information
- 📖 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and fixes

## What Happens Now

Every time you push to main:

1. **GitHub Actions** runs your tests (2-3 minutes)
2. **If tests pass**, GitHub Actions triggers PythonAnywhere reload
3. **GitHub webhook** notifies your app immediately
4. **Your app** pulls code, runs migrations, and reloads
5. **Changes are live!** (usually within 10-30 seconds)

No more manual deployments! 🎉
