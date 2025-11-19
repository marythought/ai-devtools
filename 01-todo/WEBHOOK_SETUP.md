# GitHub Webhook Auto-Deployment Setup

This guide will help you set up automatic deployments to PythonAnywhere using GitHub webhooks.

## How It Works

1. You push code to the `main` branch on GitHub
2. GitHub sends a webhook notification to your PythonAnywhere app
3. Your app receives the webhook and runs the deployment script
4. Code is pulled, dependencies installed, migrations run, and the app reloaded

## Step 1: Configure Django Settings

Add the webhook secret to your Django settings. On PythonAnywhere, edit your WSGI file or create a `.env` file:

### Option A: Add to WSGI Configuration File

1. Go to PythonAnywhere Web tab
2. Click on your WSGI configuration file
3. Add this line near the top (after imports):

```python
import os

# ... existing code ...

# GitHub webhook secret (generate a random string)
os.environ['GITHUB_WEBHOOK_SECRET'] = 'your-random-secret-string-here'
```

### Option B: Add to settings.py

Edit `todo_project/settings.py` and add:

```python
import os

GITHUB_WEBHOOK_SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', '')
```

Then set the environment variable in your WSGI file as shown in Option A.

### Generating a Secret

Generate a secure random string:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Save this secret - you'll need it for GitHub configuration.

## Step 2: Deploy the Webhook Code

1. On PythonAnywhere, pull the latest code:

```bash
cd ~/ai-devtools/01-todo
git pull origin main
```

2. Run migrations (in case there are any):

```bash
source ~/.virtualenvs/ai-devtools/bin/activate
python manage.py migrate
```

3. Reload your web app from the Web tab

## Step 3: Test the Webhook Endpoint

Before configuring GitHub, test that your webhook endpoint is accessible:

```bash
curl -X POST https://marythought.pythonanywhere.com/webhook/github/ \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/test"}'
```

You should get a JSON response like:
```json
{"status": "ignored", "reason": "Not main branch: refs/heads/test"}
```

If you get a 404 or 500 error, check your PythonAnywhere error log.

## Step 4: Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/marythought/ai-devtools

2. Click **Settings** → **Webhooks** → **Add webhook**

3. Configure the webhook:
   - **Payload URL**: `https://marythought.pythonanywhere.com/webhook/github/`
   - **Content type**: `application/json`
   - **Secret**: (paste the secret you generated in Step 1)
   - **Which events**: Select "Just the push event"
   - **Active**: ✅ Checked

4. Click **Add webhook**

## Step 5: Test the Webhook

1. Make a small change to your code locally

2. Commit and push to main:

```bash
git add .
git commit -m "test webhook deployment"
git push origin main
```

3. Check GitHub webhook deliveries:
   - Go to Settings → Webhooks
   - Click on your webhook
   - Click "Recent Deliveries"
   - You should see a green checkmark ✅ with a 200 response

4. Verify deployment on PythonAnywhere:
   - Your app should automatically reload
   - Check the PythonAnywhere server log to see deployment activity

## Troubleshooting

### Webhook Returns 403 (Forbidden)

- The webhook secret doesn't match
- Check that `GITHUB_WEBHOOK_SECRET` is set correctly in your WSGI file
- Verify the secret in GitHub webhook settings matches

### Webhook Returns 500 (Server Error)

- Check PythonAnywhere error log (Web tab → Log files → Error log)
- Common issues:
  - Import error in `webhook_views.py`
  - Missing dependencies
  - Database locked

### Deployment Not Running

- Check that the webhook payload shows `"ref": "refs/heads/main"`
- Verify git can pull without authentication (set up SSH keys or use HTTPS with saved credentials)
- Check PythonAnywhere server log for deployment output

### Git Pull Fails (Authentication)

On PythonAnywhere, you need to authenticate git pulls. Best approach:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "pythonanywhere-deploy"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Add this to GitHub: Settings → SSH and GPG keys → New SSH key
```

Then update your git remote to use SSH:

```bash
cd ~/ai-devtools
git remote set-url origin git@github.com:marythought/ai-devtools.git
```

### Verifying Everything Works

After pushing a commit, you should see:

1. ✅ GitHub Actions runs tests successfully
2. ✅ GitHub webhook shows 200 response
3. ✅ PythonAnywhere app automatically reloads with new code

## Security Notes

- **Keep your webhook secret private** - never commit it to git
- The webhook endpoint is public but validates the GitHub signature
- Only push events to the `main` branch trigger deployments
- The deployment runs with your PythonAnywhere user permissions

## Manual Deployment

If you need to deploy manually, you can:

**Option 1: Use the management command**
```bash
cd ~/ai-devtools/01-todo
source ~/.virtualenvs/ai-devtools/bin/activate
python manage.py deploy
```

**Option 2: Use the deployment script**
```bash
cd ~/ai-devtools/01-todo
./bin/deploy_pythonanywhere.sh
```

## Monitoring Deployments

To see deployment logs on PythonAnywhere:

1. Go to Web tab
2. Scroll to "Log files"
3. Click "Server log" to see deployment output
4. Click "Error log" if something went wrong

You can also check recent webhook deliveries on GitHub to see if the webhook was triggered.
