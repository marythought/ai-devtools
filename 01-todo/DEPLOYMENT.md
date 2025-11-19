# Deployment Setup for PythonAnywhere

This document explains how to set up automatic deployment to PythonAnywhere using GitHub Actions.

## Prerequisites

1. A PythonAnywhere account with a web app already configured
2. Your Django app running on PythonAnywhere
3. GitHub repository with the code

## PythonAnywhere Setup

### 1. Get Your API Token

1. Log in to PythonAnywhere
2. Go to Account → API Token
3. Generate a new API token if you don't have one
4. Save this token securely (you'll need it for GitHub secrets)

### 2. Configure Your Web App

Make sure your PythonAnywhere web app is configured with:
- Python version: 3.9 or higher
- Virtual environment at `~/venv`
- Source code at `~/ai-devtools/01-todo`
- WSGI file properly configured

### 3. Set Up Git Repository

In your PythonAnywhere bash console:

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/ai-devtools.git
cd ai-devtools/01-todo
```

### 4. Virtual Environment

Your virtual environment should be at:
```bash
~/.virtualenvs/ai-devtools
```

To activate it:
```bash
source ~/.virtualenvs/ai-devtools/bin/activate
```

Install dependencies:
```bash
cd ~/ai-devtools/01-todo
pip install -r requirements.txt
```

## GitHub Secrets Setup

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add each of the following:

### Required Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `PYTHONANYWHERE_USERNAME` | Your PythonAnywhere username | `yourusername` |
| `PYTHONANYWHERE_API_TOKEN` | Your PythonAnywhere API token | `abc123def456...` |
| `PYTHONANYWHERE_DOMAIN` | Your PythonAnywhere domain | `yourusername.pythonanywhere.com` |

## How It Works

The CI/CD pipeline runs in two stages and is **fully automatic** - no PythonAnywhere configuration needed!

### 1. Test Stage
- Runs on every push to the `main` branch that modifies files in `01-todo/`
- Sets up Python 3.9
- Installs dependencies from `requirements.txt`
- Runs Django test suite
- Deployment only proceeds if all tests pass

### 2. Deploy Stage (Fully Automatic!)
- Only runs if tests pass
- Uses PythonAnywhere API to run deployment commands:
  1. `git pull origin main` - Pull latest code
  2. `pip install -r requirements.txt` - Update dependencies
  3. `python manage.py migrate` - Run database migrations
  4. `python manage.py collectstatic --noinput` - Collect static files
  5. Reload the web app

**That's it!** Every push to main automatically deploys to PythonAnywhere. No manual steps required.

## Manual Deployment

If you need to deploy manually, you can SSH into PythonAnywhere and run:

```bash
cd ~/ai-devtools/01-todo
./bin/deploy_pythonanywhere.sh
```

Make sure the script is executable:
```bash
chmod +x bin/deploy_pythonanywhere.sh
```

## Troubleshooting

### Tests Failing in CI
- Check the Actions tab in GitHub to see the test output
- Ensure all tests pass locally before pushing: `python manage.py test`

### Deployment Failing
- Verify your GitHub secrets are correct
- Check PythonAnywhere API token is valid
- Ensure your virtual environment path is correct (`~/venv`)
- Check the PythonAnywhere error logs in the web app dashboard

### App Not Reloading
- The WSGI file path must match your PythonAnywhere configuration
- Default path is `/var/www/YOURDOMAIN_wsgi.py`
- You can manually reload from the PythonAnywhere web app dashboard

### Database Migration Issues
- SSH into PythonAnywhere and manually run: `python manage.py migrate`
- Check for migration conflicts
- Ensure database permissions are correct

## Environment Variables

Make sure your PythonAnywhere environment has these variables set in the WSGI configuration:

- `SECRET_KEY` - Django secret key (never commit this!)
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Include your PythonAnywhere domain

## Monitoring

After each deployment:
1. Check the Actions tab in GitHub for deployment status
2. Visit your PythonAnywhere web app to verify it's working
3. Check PythonAnywhere error logs if something goes wrong

## Security Notes

- Never commit your `SECRET_KEY` or API tokens to git
- Keep your `.gitignore` up to date
- Use GitHub secrets for all sensitive information
- Regularly rotate your PythonAnywhere API token
