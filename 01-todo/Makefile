VENV?=.venv
PYTHON?=python3
HOST?=127.0.0.1
PORT?=8000

.PHONY: help venv install setup migrate collectstatic createsuperuser run test
.PHONY: coverage coverage-html coverage-install coverage-clean
.PHONY: lint format lint-check

help:
	@echo "Makefile targets:"
	@echo "  make venv            # create virtualenv at $(VENV)"
	@echo "  make install         # install requirements"
	@echo "  make setup           # venv + install + migrate + collectstatic"
	@echo "  make migrate         # run migrations"
	@echo "  make collectstatic   # collect static files"
	@echo "  make createsuperuser # interactive createsuperuser"
	@echo "  make run             # start development server (use PORT and HOST env vars to override)"
	@echo "  make stop            # stop server by killing process listening on PORT"
	@echo "  make restart         # stop then start the development server"
	@echo "  make test            # run Django tests"
	@echo "  make lint            # run ruff linter and formatter checks"
	@echo "  make lint-check      # alias for lint"
	@echo "  make format          # auto-fix with ruff (format + lint --fix)"

venv:
	@if [ ! -d "$(VENV)" ]; then \
		$(PYTHON) -m venv $(VENV); \
		echo "created virtualenv at $(VENV)"; \
	else \
		echo "virtualenv $(VENV) already exists"; \
	fi

install: venv
	@. $(VENV)/bin/activate && pip install --upgrade pip && \
	if [ -f requirements.txt ]; then pip install -r requirements.txt; else pip install "Django>=4.2,<4.3"; fi

setup: install migrate collectstatic
	@echo "setup complete"

migrate:
	@. $(VENV)/bin/activate && python manage.py migrate

collectstatic:
	@. $(VENV)/bin/activate && python manage.py collectstatic --noinput || true

createsuperuser:
	@. $(VENV)/bin/activate && python manage.py createsuperuser

run:
	@. $(VENV)/bin/activate && python manage.py runserver $(HOST):$(PORT)

test:
	@. $(VENV)/bin/activate && pytest

stop:
	@p=$$(lsof -t -i:$(PORT) 2>/dev/null || true); \
	if [ -n "$$p" ]; then \
		echo "Killing process(es) on port $(PORT): $$p"; \
		kill $$p || true; \
	else \
		echo "No process listening on port $(PORT)"; \
	fi

restart:
	@$(MAKE) stop PORT=$(PORT)
	@$(MAKE) run PORT=$(PORT)

coverage-install:
	@. $(VENV)/bin/activate && pip install --upgrade pip && pip install -r requirements-dev.txt

coverage:
	@. $(VENV)/bin/activate && pytest --cov=. --cov-report=term-missing

coverage-html:
	@. $(VENV)/bin/activate && pytest --cov=. --cov-report=html && echo "Open htmlcov/index.html"

coverage-clean:
	@rm -rf htmlcov .coverage || true

lint: lint-check

lint-check:
	@. $(VENV)/bin/activate && ruff check . && ruff format --check .

format:
	@. $(VENV)/bin/activate && ruff check --fix . && ruff format .

ssh:
	@ssh -i ../pythonanywhere_deploy_key marythought@ssh.pythonanywhere.com
