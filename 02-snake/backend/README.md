# Snake Game API - Backend

FastAPI backend for the multiplayer snake game with spectator mode, based on OpenAPI specifications.

## Features

- **Authentication**: User signup, login, logout with JWT tokens
- **Leaderboard**: Track and display high scores
- **Active Players**: Monitor currently active players
- **Spectator Mode**: Watch other players' games in real-time
- **Mock Database**: In-memory database for development (to be replaced with PostgreSQL)

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Pydantic**: Data validation using Python type annotations
- **JWT**: Secure authentication using JSON Web Tokens
- **bcrypt**: Password hashing
- **pytest**: Testing framework

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application and routes
│   ├── models.py         # Pydantic models
│   ├── database.py       # Mock database implementation
│   └── auth.py           # Authentication and JWT handling
├── tests/
│   ├── __init__.py
│   └── test_api.py       # Comprehensive API tests
├── main.py               # Entry point to run the application
├── pyproject.toml        # Project dependencies
└── README.md             # This file
```

## Setup

### Prerequisites

- Python 3.9 or higher
- `uv` package manager

### Installation

1. Install dependencies:
```bash
uv sync
```

## Running the Application

Start the development server with hot reload:

```bash
uv run python main.py
```

The API will be available at:
- API: http://localhost:8000
- Interactive API docs (Swagger UI): http://localhost:8000/docs
- Alternative API docs (ReDoc): http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate and get JWT token
- `POST /api/v1/auth/logout` - End current session
- `GET /api/v1/auth/current` - Get current user profile

### Leaderboard

- `GET /api/v1/leaderboard` - Get top players by high score
- `POST /api/v1/scores` - Submit a new score

### Players

- `GET /api/v1/players/active` - Get list of active players
- `GET /api/v1/players/{username}/state` - Get game state for spectator mode

## Testing

Run all tests:
```bash
uv run pytest
```

Run tests with verbose output:
```bash
uv run pytest -v
```

Run tests with coverage:
```bash
uv run pytest --cov=app tests/
```

All 25 tests should pass, covering:
- Root endpoint
- User signup and login
- Authentication and authorization
- Leaderboard functionality
- Score updates
- Active players and spectator mode

## Mock Database

The current implementation uses an in-memory mock database (`MockDatabase` in `app/database.py`) with the following features:

- User management (create, retrieve)
- Password hashing and verification
- High score tracking
- Session management
- Active player tracking
- Game state storage

**Note**: The mock database will be replaced with a real database (PostgreSQL/SQLite with SQLAlchemy) in a future iteration.

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Bearer token authentication scheme
- Secure password requirements (minimum 6 characters)
- Username requirements (minimum 3 characters)

**Important**: In production, change the SECRET_KEY in `app/auth.py` to a secure random value and store it in environment variables.

## Development

### Adding New Endpoints

1. Define Pydantic models in `app/models.py`
2. Add route handler in `app/main.py`
3. Update mock database methods in `app/database.py` if needed
4. Write tests in `tests/test_api.py`

### CORS Configuration

CORS is configured to allow all origins in development. Update the `allow_origins` parameter in `app/main.py` for production use.

## Next Steps

- [ ] Replace mock database with PostgreSQL/SQLite using SQLAlchemy
- [ ] Add database migrations with Alembic
- [ ] Implement real-time game state updates with WebSockets
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Deploy to production

## License

This project is part of the AI Development Tools course.
