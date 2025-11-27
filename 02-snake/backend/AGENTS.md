# Guidelines for AI Agents

## Dependency Management

For backend development, use `uv` for dependency management.

### Useful Commands

```bash
# Sync dependencies from lockfile
uv sync

# Add a new package
uv add <PACKAGE-NAME>

# Add a development package
uv add --dev <PACKAGE-NAME>

# Remove a package
uv remove <PACKAGE-NAME>

# Run Python files
uv run python <PYTHON-FILE>

# Run tests
uv run pytest
```

## Running the Application

```bash
# Run the FastAPI application with hot reload
uv run python main.py

# Or run directly with uvicorn
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_api.py

# Run with coverage
uv run pytest --cov=app tests/
```

## API Verification

```bash
# Verify the running API server
# (Make sure the server is running first with: uv run python main.py)
uv run python verify_api.py
```

## Code Quality

```bash
# Check code with ruff
uv run ruff check .

# Format code with ruff
uv run ruff format .
```
