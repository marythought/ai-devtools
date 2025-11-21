# Django TODO Application

A full-stack TODO application built with Django featuring user authentication, category management and CRUD operations. It contains a demo account and features CI/CD setup and internationalization.

[![CI Status](https://github.com/marythought/ai-devtools/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/marythought/ai-devtools/actions/workflows/ci.yml)

[![Codecov](https://codecov.io/gh/marythought/ai-devtools/branch/main/graph/badge.svg)](https://codecov.io/gh/marythought/ai-devtools)

[![Deploy Status](https://github.com/marythought/ai-devtools/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/marythought/ai-devtools/actions/workflows/deploy.yml)

Deployed via https://marythought.pythonanywhere.com/

**Tech Stack:** Python, Django, SQLite, Pythonanywhere, Codecov, Github Actions

See [01-overview/homework.md](https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/blob/main/cohorts/2025/01-overview/homework.md) for more details about the project requirements.

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

## Running Tests

This project uses **pytest** for testing with Django integration.

### Quick Start
```bash
# Run all tests
make test

# Or directly with pytest
. .venv/bin/activate && pytest
```

### Test Commands

```bash
# Run all tests with verbose output
. .venv/bin/activate && pytest -v

# Run a specific test file
. .venv/bin/activate && pytest tests/test_meta_pages.py

# Run a specific test class
. .venv/bin/activate && pytest tests/test_meta_pages.py::AboutSiteViewTests

# Run a specific test
. .venv/bin/activate && pytest tests/test_meta_pages.py::AboutSiteViewTests::test_about_site_page_loads
```

### Code Coverage

Development dependencies for coverage are listed in `requirements-dev.txt`.

```bash
# Install coverage dependencies
. .venv/bin/activate
make coverage-install

# Run tests with coverage report
make coverage

# Or directly with pytest
. .venv/bin/activate && pytest --cov=. --cov-report=term-missing

# Generate HTML coverage report
make coverage-html
# Then open htmlcov/index.html in your browser
```

### Test Configuration

Tests are configured in `pyproject.toml`:
- Test framework: **pytest** with pytest-django plugin
- Test location: `tests/` directory
- Coverage target: 90%+ (currently ~97%)
- All tests use Django's test database (auto-created and destroyed)

### Writing Tests

Test files should:
- Be located in the `tests/` directory
- Follow naming convention: `test_*.py`
- Use Django TestCase or pytest fixtures
- See existing tests for examples

Scripts and Makefile
- Helper scripts are stored in the `scripts/` folder (`scripts/run-local.sh`).
- Use the top-level `Makefile` in this directory for common tasks: `make venv`, `make install`, `make migrate`, `make collectstatic`, `make createsuperuser`, `make run`, `make test`.

## Deploying

The CI/CD pipeline runs in two stages and is fully automatic to PythonAnywhere.

### 1. Linter/Test Stage
- Runs on every push to the `main` branch that modifies files in `01-todo/`
- Sets up Python 3.9
- Installs dependencies from `requirements.txt`
- Runs Django test suite
- Deployment only proceeds if all tests pass

### 2. Deploy Stage
- Only runs on a commit to main if tests pass
- Uses PythonAnywhere SSH to run deployment commands & API to refresh the app:
  1. `git pull origin main` - Pull latest code
  2. `pip install -r requirements.txt` - Update dependencies
  3. `python manage.py migrate` - Run database migrations
  4. `python manage.py collectstatic --noinput` - Collect static files
  5. Reload the web app

## Prerequisites

- Python 3.9+
- Django 4.2+

The database (db.sqlite3) is set up and ready to use.
