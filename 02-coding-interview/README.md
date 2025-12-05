# Coding Interview Platform

A real-time collaborative coding platform for conducting technical interviews with live code execution, multi-language support, and user presence indicators.

## Features

- Real-time collaborative code editing with Yjs CRDTs
- Monaco Editor with syntax highlighting for multiple languages
- Live code execution in Docker containers
- WebSocket-based real-time communication
- User presence and cursor tracking
- Session persistence and auto-save
- Multi-language support (JavaScript, TypeScript, Python, Java, Go, Rust, C++)

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

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure Services

```bash
npm run docker:up
```

This starts PostgreSQL and Redis in Docker containers.

### 3. Set Up Backend Environment

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` if needed to match your setup.

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Start Development Servers

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
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio
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

## Next Steps

See [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) for the complete implementation roadmap.

Current phase: **Phase 1 Complete** - Project structure set up

Next phase: **Phase 2** - Implement Monaco Editor and real-time collaboration

## License

MIT
