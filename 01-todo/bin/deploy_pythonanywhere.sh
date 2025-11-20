#!/bin/bash

# PythonAnywhere Deployment Script
# This script should be run on PythonAnywhere after git pull

set -e  # Exit on error

echo "Starting deployment..."

# Activate virtual environment
source ~/.virtualenvs/ai-devtools/bin/activate

# Navigate to project directory
cd ~/ai-devtools/01-todo

# Pull latest changes
echo "Pulling latest changes from git..."
git pull origin main

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create/update demo user
echo "Setting up demo user..."
python manage.py create_demo_user --with-sample-data

# Reload web app
echo "Reloading web app..."
# Touch the WSGI file to reload the app
touch /var/www/${PYTHONANYWHERE_DOMAIN}_wsgi.py

echo "Deployment complete!"
