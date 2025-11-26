# 🐍 Multiplayer Snake Game - Implementation Guide

A fully-featured Snake game with multiplayer features, spectator mode, and leaderboard functionality. Built with vanilla JavaScript and comprehensive test coverage.

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

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Node.js (for running tests)

### Installation

1. Navigate to the project directory:
```bash
cd /path/to/ai-devtools/02-snake
```

2. Install dependencies (for testing):
```bash
npm install
```

3. Serve the application:
```bash
npm run serve
```

4. Open your browser to:
```
http://localhost:8000
```

## How to Play

### Login/Signup
- **Demo Accounts**: Use any of these pre-existing accounts:
  - Username: `player1`, Password: `pass123`
  - Username: `snakemaster`, Password: `pass123`
  - Username: `gamer99`, Password: `pass123`

- **Create New Account**: Click "Sign up" and create your own account

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
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styling
├── js/
│   ├── api.js            # Mock backend API (centralized)
│   ├── snake.js          # Snake game logic
│   ├── bot.js            # AI bot player
│   └── main.js           # Application controller
├── tests/
│   ├── api.test.js       # API tests
│   ├── snake.test.js     # Game logic tests
│   └── bot.test.js       # Bot AI tests
├── package.json
├── jest.config.js
└── README.md
```

## Architecture Details

### Mock Backend API (`api.js`)
All backend calls are centralized in this module for easy migration to a real backend:

**Authentication**:
- `login(username, password)` - User login
- `signup(username, password)` - User registration
- `logout()` - User logout
- `getCurrentUser()` - Get current logged-in user

**Leaderboard**:
- `getLeaderboard()` - Fetch top 10 players
- `updateScore(username, score)` - Update player score

**Spectator**:
- `getActivePlayers()` - Get list of active players
- `getPlayerGameState(username)` - Get player's game state

### Data Persistence
- **LocalStorage Keys**:
  - `snake_users` - All registered users
  - `snake_current_user` - Currently logged-in user
  - `snake_leaderboard` - Leaderboard data

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

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Coverage Report
Tests include comprehensive coverage of:
- ✅ Authentication (login, signup, logout)
- ✅ User persistence
- ✅ Leaderboard functionality
- ✅ Score updates
- ✅ Snake movement (both modes)
- ✅ Collision detection
- ✅ Food collection
- ✅ AI bot decision making
- ✅ Game state management

Current coverage: **80%+** across all modules

### Test Files
- `tests/api.test.js` - 50+ tests for API functionality
- `tests/snake.test.js` - 40+ tests for game logic
- `tests/bot.test.js` - 25+ tests for AI bot

## Technical Details

### Technologies
- **Vanilla JavaScript** (ES6 modules)
- **Canvas API** for rendering
- **LocalStorage** for persistence
- **Jest** for testing
- **CSS3** for styling

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Performance
- Game runs at ~7 FPS (150ms per frame)
- Bot runs at ~5 FPS (200ms per frame)
- Efficient canvas rendering
- No external dependencies for runtime

## Future Enhancements (Real Backend)

When migrating to a real backend, only `api.js` needs modification:

1. Replace LocalStorage with HTTP requests
2. Add WebSocket for real-time multiplayer
3. Implement actual player matching
4. Add chat functionality
5. Store game replays

The rest of the codebase remains unchanged!

## License

MIT

## Author

Mary Dickson
