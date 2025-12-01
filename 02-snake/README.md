# 🐍 Snake Game - Full Stack Application

A multiplayer snake game with spectator mode, featuring a React/TypeScript frontend and FastAPI backend with JWT authentication.

## Features

### ✨ Game Modes
- **Pass-Through Walls**: Snake wraps around edges (easier mode)
- **Walls Mode**: Classic snake - die on wall collision (harder mode)

### 👥 Multiplayer Features
- **User Authentication**: Login and signup functionality
- **Leaderboard**: Top 10 players ranked by high score
- **Spectator Mode**: Watch other players in real-time
- **AI Bots**: Simulated players with intelligent pathfinding

### 🎮 Gameplay
- Smooth snake movement with keyboard controls
- Score tracking with high score persistence
- Pause/resume functionality
- Game over screen with play again option

### 🏗️ Architecture
- **Mock Backend API**: All backend calls centralized in `api.js`
- **Modular Design**: Separate modules for game logic, bot AI, and API
- **LocalStorage Persistence**: User data and scores saved locally
- **Fully Tested**: Comprehensive test suite with Jest

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- `uv` package manager for Python

### Installation

1. **Install root dependencies** (concurrently):
```bash
npm install
```

2. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

3. **Install backend dependencies**:
```bash
cd backend
uv sync
```

### Run Both Frontend and Backend

**Option 1: Run both together** (recommended):
```bash
npm run dev
```

This starts:
- Backend API at http://localhost:8000
- Frontend at http://localhost:5173

**Option 2: Run separately**:

Backend:
```bash
cd backend
uv run python main.py
```

Frontend:
```bash
cd frontend
npm run dev
```

## How to Play

### Login/Signup
- **Create New Account**: Click "Sign up" and create your own account
  - Username: minimum 3 characters
  - Password: minimum 6 characters
- All accounts are stored in the backend database

### Controls
- **Arrow Keys**: Control snake direction (↑ ↓ ← →)
- **Spacebar**: Pause/Resume game
- **Start Button**: Begin game
- **Reset Button**: Restart game

### Game Modes
1. **Pass-Through Walls**: Snake wraps around screen edges
2. **Walls (Classic)**: Game over if snake hits walls

### Leaderboard
- View top 10 players ranked by score
- Your high score automatically updates
- Click "Refresh" to see latest rankings

### Spectator Mode
1. Click "Watch Players" tab
2. Select a player from the active players list
3. Watch their AI-controlled game in real-time
4. See their current score update live

## Project Structure

```
02-snake/
├── frontend/              # React TypeScript frontend
│   ├── js/
│   │   ├── api.ts        # Real API client (connects to backend)
│   │   ├── main.ts       # Main game logic
│   │   ├── snake.ts      # Snake game engine
│   │   └── bot.ts        # Bot logic for spectator mode
│   ├── tests/            # Frontend tests
│   └── package.json
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # API routes
│   │   ├── models.py    # Pydantic models
│   │   ├── auth.py      # JWT authentication
│   │   └── database.py  # Mock database
│   ├── tests/           # Backend tests (25 tests)
│   ├── verify_api.py    # API verification script
│   ├── AGENTS.md        # AI agent guidelines
│   └── README.md
├── openapi.yaml         # API specification
├── INTEGRATION.md       # Integration guide
├── package.json         # Root scripts for running both
└── README.md            # This file
```

## Architecture

### Stack
- **Frontend**: TypeScript/JavaScript with Vite
- **Backend**: FastAPI (Python)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: Mock in-memory database (ready for PostgreSQL/SQLite)

### API Integration
The frontend API client (`frontend/js/api.ts`) connects to the backend:

**Endpoints** (all prefixed with `/api/v1`):
- `POST /auth/signup` - Create account (returns JWT token)
- `POST /auth/login` - Login (returns JWT token)
- `POST /auth/logout` - Logout
- `GET /auth/current` - Get current user
- `GET /leaderboard` - Get top players
- `POST /scores` - Submit score (authenticated)
- `GET /players/active` - Get active players (authenticated)
- `GET /players/{username}/state` - Get player state (authenticated)

### Data Persistence
- **Frontend**: JWT token in localStorage
- **Backend**: In-memory mock database with:
  - User accounts (bcrypt hashed passwords)
  - High scores and leaderboard
  - Active player sessions
  - Game states for spectator mode

### Game Logic (`snake.js`)
- Grid-based snake movement
- Collision detection (self and walls)
- Food spawning algorithm
- Score tracking
- Mode switching

### AI Bot (`bot.js`)
- Simple pathfinding AI
- Moves towards food using Manhattan distance
- Avoids walls and self-collision
- Makes semi-random decisions for variety

## Testing

### Run All Tests
```bash
npm test
```
This runs both frontend and backend tests concurrently.

### Test Separately

**Backend tests**:
```bash
cd backend
uv run pytest -v
```
- 25 comprehensive tests
- Authentication, leaderboard, scores, players endpoints
- All tests passing ✅

**Frontend tests**:
```bash
cd frontend
npm test
```

### Verify API Integration
```bash
# Start backend first
cd backend
uv run python main.py

# In another terminal
cd backend
uv run python verify_api.py
```

### Test Coverage
- ✅ User authentication with JWT
- ✅ Password validation and hashing
- ✅ Leaderboard functionality
- ✅ Score tracking and updates
- ✅ Active player monitoring
- ✅ Spectator mode game states
- ✅ Error handling and validation
- ✅ CORS and security

## Development

### Backend Code Quality
```bash
cd backend

# Check code
uv run ruff check .

# Format code
uv run ruff format .

# Run tests
uv run pytest -v
```

All backend code passes ruff checks ✅

### Frontend Development
```bash
cd frontend

# Run dev server
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Documentation

- [Backend README](backend/README.md) - Backend-specific documentation
- [Backend AGENTS.md](backend/AGENTS.md) - Guidelines for AI agents
- [INTEGRATION.md](INTEGRATION.md) - Frontend-Backend integration guide
- [OpenAPI Spec](openapi.yaml) - API specification

## Next Steps

- [ ] Replace mock database with PostgreSQL
- [ ] Add database migrations (Alembic)
- [ ] Implement WebSocket for real-time updates
- [ ] Add rate limiting
- [ ] Deploy to cloud (Render, Vercel, etc.)
- [ ] Add CI/CD pipeline

## License

MIT

## Author

Mary Dickson
