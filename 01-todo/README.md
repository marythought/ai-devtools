# Django TODO Application

A full-stack TODO application built with Django featuring user authentication, category management and CRUD operations.

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


## Prerequisites

- Python 3.9+
- Django 4.2+

The database (db.sqlite3) is set up and ready to use.
