# Django TODO Application

A full-stack TODO application built with Django featuring user authentication, category management and CRUD operations.

[![Coverage Status](https://github.com/marythought/ai-devtools/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/marythought/ai-devtools/actions/workflows/coverage.yml)

[![Codecov](https://codecov.io/gh/marythought/ai-devtools/branch/main/graph/badge.svg)](https://codecov.io/gh/marythought/ai-devtools)
[![Deploy Status](https://github.com/marythought/ai-devtools/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/marythought/ai-devtools/actions/workflows/deploy.yml)

Deployed via https://marythought.pythonanywhere.com/

**Tech Stack:** Python, Django, SQLite, Pythonanywhere

See [01-todo/homework.md](01-todo/homework.md) for more details about the project requirements.

## Running the Application

1. Create a virtualenv and install dependencies, run migrations, and collect static files:
   ```bash
   cd ../ai-devtools/01-todo
   make setup
   ```
2. Start the development server:
   ```bash
   make run
   ```
3. Run tests:
   ```bash
   make test
   ```

After the server starts, open browser to:
```
http://127.0.0.1:8000/
```

Scripts and Makefile
- Helper scripts are stored in the `scripts/` folder (`scripts/run-local.sh`).
- Use the top-level `Makefile` in this directory for common tasks: `make venv`, `make install`, `make migrate`, `make collectstatic`, `make createsuperuser`, `make run`, `make test`.

Code Coverage
- Development dependencies for coverage are listed in `requirements-dev.txt`.
- Install them into your virtualenv:
   ```bash
   . .venv/bin/activate
   make coverage-install
   ```
- Run tests with coverage and show a report:
   ```bash
   make coverage
   ```
- Generate an HTML coverage report:
   ```bash
   make coverage-html
   # open htmlcov/index.html in your browser
   ```

## Deploying

The CI/CD pipeline runs in two stages and is fully automatic to PythonAnywhere.

### 1. Test Stage
- Runs on every push to the `main` branch that modifies files in `01-todo/`
- Sets up Python 3.9
- Installs dependencies from `requirements.txt`
- Runs Django test suite
- Deployment only proceeds if all tests pass

### 2. Deploy Stage
- Only runs if tests pass
- Uses PythonAnywhere API to run deployment commands:
  1. `git pull origin main` - Pull latest code
  2. `pip install -r requirements.txt` - Update dependencies
  3. `python manage.py migrate` - Run database migrations
  4. `python manage.py collectstatic --noinput` - Collect static files
  5. Reload the web app

## Prerequisites

- Python 3.9+
- Django 4.2+

The database (db.sqlite3) is set up and ready to use.
