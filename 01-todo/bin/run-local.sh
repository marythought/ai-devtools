#!/usr/bin/env zsh
set -euo pipefail

# Small helper to run the project locally on macOS/Linux (zsh).
# Usage: ./scripts/run-local.sh
# It will create a virtualenv at .venv if missing, install requirements,
# run migrations, collectstatic, and start the dev server on 127.0.0.1:8000.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$REPO_DIR/.venv"

echo "Project dir: $REPO_DIR"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtualenv at $VENV_DIR..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "Upgrading pip and installing dependencies..."
pip install --upgrade pip
if [ -f "$REPO_DIR/requirements.txt" ]; then
  pip install -r "$REPO_DIR/requirements.txt"
else
  pip install "Django>=4.2,<4.3"
fi

# Default development environment variables (only set if not already set)
DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-dev-secret-change-this}"
DJANGO_DEBUG="${DJANGO_DEBUG:-True}"
DJANGO_ALLOWED_HOSTS="${DJANGO_ALLOWED_HOSTS:-localhost,127.0.0.1}"
export DJANGO_SECRET_KEY DJANGO_DEBUG DJANGO_ALLOWED_HOSTS

echo "Applying migrations..."
python manage.py migrate

echo "Collecting static files (to staticfiles/)..."
# Ignore collectstatic failure (some setups may not need it)
python manage.py collectstatic --noinput || true

echo "Starting development server at 127.0.0.1:8000..."
exec python manage.py runserver 127.0.0.1:8000
