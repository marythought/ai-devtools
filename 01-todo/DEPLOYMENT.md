# Deployment Setup for PythonAnywhere

This document explains how to set up automatic deployment to PythonAnywhere using GitHub Actions with SSH.

## Quick Start

Follow these steps to enable automated deployment:

1. **Generate SSH key pair** (on your local machine)
2. **Add public key to PythonAnywhere** (`~/.ssh/authorized_keys`)
3. **Add secrets to GitHub** (`PYTHONANYWHERE_USERNAME`, `PYTHONANYWHERE_SSH_KEY`, `PYTHONANYWHERE_DOMAIN`)
4. **Push to main branch** - deployment happens automatically!

## Prerequisites

1. A PythonAnywhere account with a web app already configured
2. Your Django app running on PythonAnywhere
3. GitHub repository with the code
4. **SSH access to PythonAnywhere** (requires a paid account - Hacker plan or above)

> **Note:** If you have a free PythonAnywhere account, you can still deploy manually using the script. See "Manual Deployment" section below.

## PythonAnywhere Setup

### 1. Configure Your Web App

Make sure your PythonAnywhere web app is configured with:
- Python version: 3.9 or higher
- Virtual environment at `~/.virtualenvs/ai-devtools`
- Source code at `~/ai-devtools/01-todo`
- WSGI file properly configured

### 2. Set Up Git Repository

In your PythonAnywhere bash console:

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/ai-devtools.git
cd ai-devtools/01-todo
```

### 3. Virtual Environment

Set up your virtual environment:
```bash
mkvirtualenv --python=/usr/bin/python3.10 ai-devtools
cd ~/ai-devtools/01-todo
pip install -r requirements.txt
```

## SSH Setup for Automated Deployment

### 1. Generate SSH Key Pair

On your local machine or in GitHub Actions, generate an SSH key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f pythonanywhere_deploy_key -N ""
```

This creates two files:
- `pythonanywhere_deploy_key` (private key - keep this secret!)
- `pythonanywhere_deploy_key.pub` (public key)

### 2. Add Public Key to PythonAnywhere

1. Log in to PythonAnywhere
2. Go to the **Files** tab
3. Navigate to `.ssh/` directory (create it if it doesn't exist)
4. Edit (or create) the file `~/.ssh/authorized_keys`
5. Add the contents of `pythonanywhere_deploy_key.pub` on a new line
6. Save the file
7. Set proper permissions via Bash console:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### 3. Test SSH Connection

From your local machine:
```bash
ssh -i pythonanywhere_deploy_key yourusername@ssh.pythonanywhere.com
```

If successful, you should be logged into PythonAnywhere.

## GitHub Secrets Setup

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add each of the following:

### Required Secrets

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `PYTHONANYWHERE_USERNAME` | Your PythonAnywhere username | Your account username |
| `PYTHONANYWHERE_SSH_KEY` | SSH private key | Contents of `pythonanywhere_deploy_key` file |
| `PYTHONANYWHERE_DOMAIN` | Your web app domain | e.g., `yourusername.pythonanywhere.com` |

**IMPORTANT:** For `PYTHONANYWHERE_SSH_KEY`, copy the **entire** contents of the private key file, including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.



## How Automated Deployment Works

Once SSH is configured, the GitHub Actions workflow will:

1. **Trigger**: Runs automatically when CI passes on the `main` branch, or can be triggered manually via "Run workflow" button
2. **Setup SSH**: Configures SSH authentication using the private key from secrets
3. **Execute Deployment**: Connects to PythonAnywhere via SSH and runs:
   - `git pull origin main` - Pull latest code
   - `pip install -r requirements.txt` - Update dependencies
   - `python manage.py migrate` - Run database migrations
   - `python manage.py collectstatic --noinput` - Collect static files
   - `python manage.py create_demo_user --with-sample-data` - Update demo user
   - Touch WSGI file to reload the app

All of this happens automatically - no manual intervention needed!

## Manual Deployment (Fallback)

If you need to deploy manually, you can SSH into PythonAnywhere and run:

```bash
cd ~/ai-devtools/01-todo
bash bin/deploy_pythonanywhere.sh
```

## Troubleshooting

### Tests Failing in CI
- Check the Actions tab in GitHub to see the test output
- Ensure all tests pass locally before pushing: `python manage.py test`

### Deployment Failing

**SSH Connection Issues:**
- Verify SSH key is properly added to PythonAnywhere `~/.ssh/authorized_keys`
- Check that `PYTHONANYWHERE_SSH_KEY` secret contains the complete private key
- Ensure SSH permissions are correct: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
- Note: SSH access requires a paid PythonAnywhere account

**Path Issues:**
- Verify virtual environment path: `~/.virtualenvs/ai-devtools`
- Verify project path: `~/ai-devtools/01-todo`
- Check WSGI file path matches: `/var/www/${PYTHONANYWHERE_DOMAIN}_wsgi.py`

**GitHub Secrets:**
- `PYTHONANYWHERE_USERNAME` - Your PythonAnywhere username (not email)
- `PYTHONANYWHERE_SSH_KEY` - Complete private key including BEGIN/END lines
- `PYTHONANYWHERE_DOMAIN` - Full domain (e.g., `username.pythonanywhere.com`)

### App Not Reloading
- The WSGI file touch should trigger a reload automatically
- You can also manually reload from the PythonAnywhere web app dashboard
- Check the error logs if the app doesn't start

### Database Migration Issues
- SSH into PythonAnywhere and manually run: `python manage.py migrate`
- Check for migration conflicts
- Ensure database permissions are correct

### Testing SSH Locally
To test the SSH connection locally:
```bash
ssh -i /path/to/pythonanywhere_deploy_key yourusername@ssh.pythonanywhere.com
```

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

- Never commit your `SECRET_KEY` or SSH private keys to git
- Keep your `.gitignore` up to date
- Use GitHub secrets for all sensitive information
- Store SSH private keys securely and never share them
- Regularly rotate your SSH keys for security
