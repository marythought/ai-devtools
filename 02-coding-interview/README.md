# Coding Interview Platform

A real-time collaborative coding platform for conducting technical interviews with live code execution, multi-language support, and user presence indicators.

## Features

- Real-time collaborative code editing with Yjs CRDTs
- Monaco Editor with syntax highlighting for multiple languages
- **Secure browser-based code execution** using WebAssembly (WASM)
  - JavaScript: Native browser execution
  - Python: Pyodide (Python compiled to WASM)
- WebSocket-based real-time communication
- User presence and cursor tracking
- Session persistence and auto-save
- Multi-language support (JavaScript, Python with WASM, TypeScript)

## Project Structure

```
├── packages/
│   ├── frontend/          # React + Vite + Monaco Editor
│   ├── backend/           # Express + Socket.io + Prisma
│   └── shared/            # Shared TypeScript types
├── docker-compose.yml     # PostgreSQL + Redis services
└── package.json           # Monorepo configuration
```

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm 10+

## Getting Started

### Option 1: Docker (Recommended for Production)

Run the entire application (frontend + backend + database + redis) in containers:

```bash
docker compose up --build
```

The application will be available at http://localhost:3001

To stop:
```bash
docker compose down
```

### Option 2: Local Development

#### 1. Clone and Install Dependencies

```bash
npm install
```

#### 2. Start Infrastructure Services

```bash
npm run docker:up
```

This starts PostgreSQL and Redis in Docker containers.

#### 3. Set Up Backend Environment

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` if needed to match your setup.

#### 4. Run Database Migrations

```bash
npm run db:migrate
```

#### 5. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

## Development Commands

### Root Level

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build all packages
npm run test             # Run integration tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
```

### Frontend Package

```bash
cd packages/frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Backend Package

```bash
cd packages/backend
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run integration tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio
```

## Testing

The project includes comprehensive integration tests that verify client-server interactions.

### Prerequisites for Testing

Ensure Docker services (PostgreSQL and Redis) are running:

```bash
npm run docker:up
```

### Running Tests

```bash
# Run all integration tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The integration tests cover:
- ✅ **REST API**: Session creation, retrieval, and code execution
- ✅ **WebSocket**: Real-time connections, user presence, and session state
- ✅ **Database**: Execution history and session persistence
- ✅ **Code Execution**: JavaScript and Python code execution in Docker containers
- ✅ **Error Handling**: Invalid inputs, missing sessions, and edge cases
- ✅ **End-to-End Workflows**: Complete user journeys from session creation to code execution

### Test Command (for homework)

```bash
npm test
```

## API Endpoints

### REST API

- `POST /api/sessions` - Create new interview session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/execute` - Execute code

### WebSocket Events

#### Client → Server
- `join-session` - Join an interview session
- `cursor-change` - Update cursor position
- `language-change` - Change programming language

#### Server → Client
- `user-joined` - User joined session
- `user-left` - User left session
- `session-state` - Current session state
- `language-changed` - Language changed
- `remote-cursor` - Remote user cursor update

## Technology Stack

### Frontend
- React 18
- TypeScript
- Monaco Editor
- Yjs (CRDT)
- Socket.io Client
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- Socket.io
- Prisma ORM
- PostgreSQL
- Redis
- TypeScript

## Deployment

### Deploy to Render

This application is configured for deployment on [Render](https://render.com) using the included `render.yaml` configuration.

**Steps:**

1. Push your code to GitHub
2. Sign up/login to [Render](https://render.com)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Select the repository containing this code
6. Render will automatically detect `render.yaml` and create:
   - PostgreSQL database (free tier)
   - Redis instance (free tier)
   - Web service running the Docker container

The application will be available at: `https://your-app-name.onrender.com`

**Note:** Free tier services on Render may spin down after inactivity and take 30-60 seconds to wake up.

### Alternative Deployment Options

- **Railway**: Similar blueprint-based deployment
- **Fly.io**: Excellent Docker support with global edge deployment
- **DigitalOcean App Platform**: Good for production workloads
- **AWS ECS/Fargate**: For enterprise-scale deployments

## Next Steps

See [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) for the complete implementation roadmap.

Current phase: **Phase 1 Complete** - Project structure set up

Next phase: **Phase 2** - Implement Monaco Editor and real-time collaboration

## License

MIT
