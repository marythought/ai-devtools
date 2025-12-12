# Quick Start Guide

Get the Coding Interview Platform running in 5 minutes.

## Automated Setup

Run the setup script to automatically configure everything:

```bash
./setup.sh
```

This will:
1. Install all dependencies
2. Start Docker services (PostgreSQL + Redis)
3. Set up environment variables
4. Run database migrations
5. Generate Prisma client

## Manual Setup

If you prefer manual setup:

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Docker Services

```bash
npm run docker:up
```

### 3. Configure Backend

```bash
cd packages/backend
cp .env.example .env
```

### 4. Setup Database

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Servers

```bash
# From root directory
npm run dev
```

## Verify Installation

1. Open http://localhost:5173 in your browser
2. Click "Create New Session"
3. You should be redirected to a session page

## Troubleshooting

### PostgreSQL Connection Issues

Make sure PostgreSQL is running:
```bash
docker ps | grep postgres
```

If not running:
```bash
npm run docker:up
```

### Redis Connection Issues

Check Redis status:
```bash
docker ps | grep redis
```

### Port Already in Use

If ports 5173 or 3001 are already in use, you can:
- Stop the conflicting service
- Or modify the ports in:
  - `packages/frontend/vite.config.ts` (frontend)
  - `packages/backend/.env` (backend)

### Database Migration Errors

Reset the database:
```bash
cd packages/backend
npx prisma migrate reset
npx prisma migrate dev
```

## Development Workflow

### Start Development

```bash
npm run dev
```

### Run Only Backend

```bash
npm run dev:backend
```

### Run Only Frontend

```bash
npm run dev:frontend
```

### Open Database GUI

```bash
npm run db:studio
```

### Stop Docker Services

```bash
npm run docker:down
```

## Next Steps

After the basic setup is complete:

1. **Implement Monaco Editor** - Add the code editor component
2. **Add Yjs Integration** - Enable real-time collaboration
3. **Implement Code Execution** - Set up Docker-based code execution
4. **Add User Presence** - Show cursor positions and active users

See [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) for the complete roadmap.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run build` | Build all packages |
| `npm run docker:up` | Start PostgreSQL and Redis |
| `npm run docker:down` | Stop Docker services |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio GUI |

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) for architecture details
- Ensure Docker and Node.js 20+ are installed
