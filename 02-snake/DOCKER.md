# Docker Deployment Guide

This guide explains how to run the Snake Game using Docker Compose.

## Prerequisites

- Docker Desktop or Docker Engine (20.10+)
- Docker Compose (v2.0+)

**Note:** Modern Docker Desktop includes Docker Compose V2. Use `docker compose` (with a space) instead of `docker-compose` (with a hyphen).

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your configuration:**
   - Change `SECRET_KEY` to a secure random string
   - Optionally modify database credentials

3. **Build and start all services:**
   ```bash
   # Docker Compose V2 (recommended)
   docker compose up --build

   # Or if you have the older standalone version
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Services

### Frontend (Nginx)
- **Port:** 80
- **Purpose:** Serves the static frontend and proxies API requests to the backend
- **Built from:** `./frontend/Dockerfile`

### Backend (FastAPI)
- **Port:** 8000
- **Purpose:** RESTful API server for game logic and user management
- **Built from:** `./backend/Dockerfile`
- **Depends on:** PostgreSQL database

### Database (PostgreSQL)
- **Port:** 5432
- **Purpose:** Persistent data storage
- **Image:** postgres:16-alpine
- **Volume:** `postgres_data` for data persistence

## Common Commands

**Note:** Replace `docker-compose` with `docker compose` if using Docker Compose V2.

### Start services in detached mode:
```bash
docker compose up -d
```

### View logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Stop services:
```bash
docker compose down
```

### Stop services and remove volumes (WARNING: deletes all data):
```bash
docker compose down -v
```

### Rebuild a specific service:
```bash
docker compose up --build backend
```

### Access database directly:
```bash
docker compose exec db psql -U snakeuser -d snakedb
```

### Run backend tests:
```bash
# You'll need to install dependencies locally first
cd backend
uv pip install -e .
uv run pytest
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
POSTGRES_DB=snakedb
POSTGRES_USER=snakeuser
POSTGRES_PASSWORD=your-secure-password-here

# Backend Configuration
SECRET_KEY=your-very-long-and-random-secret-key-here
ENVIRONMENT=production
```

## Troubleshooting

### Docker command not found
If you get `command not found: docker` or `command not found: docker-compose`:
1. **Install Docker Desktop**: Download from https://www.docker.com/products/docker-desktop
2. **Verify installation**: `docker --version` and `docker compose version`
3. **macOS users**: Ensure Docker Desktop is running (check menu bar icon)
4. **PATH issue**: Docker Desktop should add itself to PATH automatically. If not, restart your terminal.

### docker-compose vs docker compose
- **Modern (recommended)**: `docker compose` - Built into Docker Desktop/Engine
- **Legacy**: `docker-compose` - Standalone binary (deprecated)

If you see `command not found: docker-compose`, use `docker compose` instead.

### Backend can't connect to database
- Ensure the database service is healthy: `docker compose ps`
- Check database logs: `docker compose logs db`
- Verify DATABASE_URL in backend environment

### Frontend shows connection errors
- Check if backend is running: `docker compose ps backend`
- Verify nginx configuration is correct
- Check backend logs: `docker compose logs backend`

### Ports already in use
If ports 80, 8000, or 5432 are already in use, you can modify them in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change frontend to port 8080
```

## Production Deployment

For production deployment, consider:

1. **Security:**
   - Use strong, unique passwords
   - Generate a secure SECRET_KEY
   - Enable HTTPS with Let's Encrypt
   - Restrict database access

2. **Performance:**
   - Use production-grade PostgreSQL settings
   - Enable CDN for static assets
   - Configure proper logging

3. **Monitoring:**
   - Add health checks
   - Set up logging aggregation
   - Monitor resource usage

## Development vs Production

### Local Development (SQLite)
```bash
cd backend
uv run python -m app.main
```

### Production (Docker with PostgreSQL)
```bash
docker compose up
```

The backend automatically detects which database to use based on the `DATABASE_URL` environment variable.
