# Automatic Deployment Setup

Your TODO app now has **fully automatic deployment** via GitHub Actions! Here's what you need to know:

## Current Status

✅ GitHub Actions workflow configured
✅ Tests run automatically on every push
⏳ Deployment configured but needs one-time PythonAnywhere setup

## One-Time Setup Required

Before automatic deployment will work, you need to ensure PythonAnywhere can pull from GitHub without manual authentication.

### Option 1: SSH Key (Recommended)

1. On PythonAnywhere bash console, generate an SSH key:
```bash
ssh-keygen -t ed25519 -C "pythonanywhere-deploy" -f ~/.ssh/id_ed25519 -N ""
```

2. Display the public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Add this key to GitHub:
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the public key
   - Click "Add SSH key"

4. Update your git remote to use SSH:
```bash
cd ~/ai-devtools
git remote set-url origin git@github.com:marythought/ai-devtools.git
```

5. Test it works:
```bash
git pull origin main
```

### Option 2: Personal Access Token

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Generate and copy the token

2. Configure git to use the token:
```bash
cd ~/ai-devtools
git remote set-url origin https://YOUR_TOKEN@github.com/marythought/ai-devtools.git
```

3. Test it works:
```bash
git pull origin main
```

## How It Works

Once setup is complete, every time you push to `main`:

1. **GitHub Actions runs tests** (2-3 minutes)
   - If tests fail, deployment is skipped

2. **GitHub Actions deploys to PythonAnywhere** (automatically)
   - Calls PythonAnywhere API to run deployment commands
   - Pulls latest code
   - Installs dependencies
   - Runs migrations
   - Collects static files
   - Reloads the web app

3. **Your changes are live!** (within 5 minutes of pushing)

## Verifying It Works

After pushing a commit:

1. Check **GitHub Actions** tab:
   - Should see green checkmarks for both "test" and "deploy" jobs

2. Check your **PythonAnywhere app**:
   - Visit https://marythought.pythonanywhere.com
   - Should see your latest changes

3. If something fails:
   - Check GitHub Actions logs for error messages
   - Check PythonAnywhere error log (Web tab → Error log)

## Manual Deployment

If you need to deploy manually:

```bash
cd ~/ai-devtools/01-todo
source ~/.virtualenvs/ai-devtools/bin/activate
git pull origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

Then reload the web app from the PythonAnywhere Web tab.

## Troubleshooting

### Deployment fails with "authentication required"

- PythonAnywhere can't pull from GitHub
- Complete the SSH key or Personal Access Token setup above

### Tests pass but deployment doesn't run

- Check that GitHub secrets are configured:
  - `PYTHONANYWHERE_USERNAME`
  - `PYTHONANYWHERE_API_TOKEN`
  - `PYTHONANYWHERE_DOMAIN`

### Deployment runs but changes don't appear

- Check PythonAnywhere error log for Python errors
- The migration might have failed - run manually
- Clear your browser cache

## Security Note

The `PYTHONANYWHERE_API_TOKEN` secret gives GitHub Actions permission to run commands on your PythonAnywhere account. Keep it private and never commit it to your repository.
