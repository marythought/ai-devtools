# Docker Deployment Guide

This guide explains how to build and deploy the Snake Game using Docker.

## Overview

The Docker deployment bundles:
- **Frontend**: React/TypeScript SPA served by Nginx
- **Backend**: FastAPI Python server
- **Database**: SQLite (bundled) or external PostgreSQL

Both services run in one container managed by Supervisor.

## Prerequisites

- Docker Desktop or Docker Engine (20.10+)
- 2GB+ free disk space

## Quick Start

### 1. Build the container

```bash
docker build -f docker/Dockerfile -t snake-game:latest .
```

### 2. Run the container

**With SQLite (simplest):**
```bash
docker run -d \
  -p 80:80 \
  --name snake-game \
  -e SECRET_KEY="your-secret-key-here" \
  snake-game:latest
```

**With PostgreSQL:**
```bash
docker run -d \
  -p 80:80 \
  --name snake-game \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e SECRET_KEY="your-secret-key-here" \
  -e ENVIRONMENT="production" \
  snake-game:latest
```

### 3. Access the application

- Open http://localhost in your browser
- API docs: http://localhost/api/docs

## Architecture

The single container runs:

1. **Nginx** (port 80)
   - Serves static frontend files from `/usr/share/nginx/html`
   - Proxies `/api/*` requests to backend on `127.0.0.1:8000`

2. **Uvicorn** (port 8000, localhost only)
   - FastAPI backend server
   - Handles all API requests

3. **Supervisor**
   - Process manager that starts and monitors both services
   - Automatically restarts services if they crash

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | **Yes** | - | Secret key for JWT tokens (use long random string) |
| `DATABASE_URL` | No | `sqlite:///./snake_game.db` | Database connection string |
| `ENVIRONMENT` | No | `production` | Environment mode |
| `API_HOST` | No | `127.0.0.1` | Backend host (keep as localhost) |
| `API_PORT` | No | `8000` | Backend port (keep as 8000) |

## Database Options

### Option 1: SQLite (Default)
No configuration needed. Database file is stored inside the container at `/app/snake_game.db`.

**Note:** Data is lost when container is removed. For persistence, use a volume:
```bash
docker run -d \
  -p 80:80 \
  -v snake-data:/app \
  --name snake-game \
  -e SECRET_KEY="your-secret-key" \
  snake-game:latest
```

### Option 2: External PostgreSQL
Set the `DATABASE_URL` environment variable:

```bash
# Format
DATABASE_URL=postgresql://username:password@hostname:port/database

# Example with local PostgreSQL
DATABASE_URL=postgresql://snakeuser:snakepass@host.docker.internal:5432/snakedb

# Example with cloud database
DATABASE_URL=postgresql://user:pass@db.example.com:5432/prod_db
```

## Common Commands

### View logs
```bash
# All logs
docker logs snake-game

# Follow logs
docker logs -f snake-game

# Just backend logs
docker exec snake-game tail -f /var/log/supervisor/uvicorn.out.log

# Just nginx logs
docker exec snake-game tail -f /var/log/supervisor/nginx.out.log
```

### Stop/start container
```bash
# Stop
docker stop snake-game

# Start
docker start snake-game

# Restart
docker restart snake-game
```

### Access container shell
```bash
docker exec -it snake-game /bin/bash
```

### Remove container
```bash
docker stop snake-game
docker rm snake-game
```

### Remove image
```bash
docker rmi snake-game:latest
```

## Building for Production

### 1. Generate a secure SECRET_KEY

```bash
# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Using OpenSSL
openssl rand -base64 32
```

### 2. Build with optimizations

```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t snake-game:latest \
  .
```

### 3. Tag and push to registry

```bash
# Tag for your registry
docker tag snake-game:latest your-registry.com/snake-game:v1.0.0

# Push to registry
docker push your-registry.com/snake-game:v1.0.0
```

## Cloud Deployment

### Docker Hub

```bash
# Tag with your username
docker tag snake-game:latest yourusername/snake-game:latest

# Login and push
docker login
docker push yourusername/snake-game:latest

# Run from Docker Hub
docker run -d -p 80:80 \
  -e SECRET_KEY="..." \
  --name snake-game \
  yourusername/snake-game:latest
```

### AWS ECS / Fargate

1. Push image to Amazon ECR
2. Create task definition with:
   - Port mapping: 80
   - Environment variables: SECRET_KEY, DATABASE_URL
3. Create service with load balancer

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/snake-game

# Deploy
gcloud run deploy snake-game \
  --image gcr.io/PROJECT-ID/snake-game \
  --platform managed \
  --port 80 \
  --set-env-vars SECRET_KEY=your-secret-key
```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name snake-game \
  --image yourusername/snake-game:latest \
  --dns-name-label snake-game-unique \
  --ports 80 \
  --environment-variables SECRET_KEY=your-secret-key
```

## Troubleshooting

### Container exits immediately

Check logs:
```bash
docker logs snake-game
```

Common causes:
- Missing required SECRET_KEY environment variable
- Invalid DATABASE_URL format
- Port 80 already in use

### Cannot connect to the app

1. Check container is running:
   ```bash
   docker ps | grep snake-game
   ```

2. Check port mapping:
   ```bash
   docker port snake-game
   ```

3. Check services are running:
   ```bash
   docker exec snake-game supervisorctl status
   ```

### Database connection errors

For PostgreSQL:
- Ensure database server is accessible from container
- Use `host.docker.internal` instead of `localhost` for host machine
- Verify credentials and database exists

### Nginx shows 502 Bad Gateway

Backend isn't running. Check backend logs:
```bash
docker exec snake-game tail -f /var/log/supervisor/uvicorn.err.log
```

## Health Checks

Add a health check to your `docker run` command:

```bash
docker run -d \
  -p 80:80 \
  --name snake-game \
  --health-cmd="curl -f http://localhost/api/health || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  -e SECRET_KEY="..." \
  snake-game:latest
```

## Security Considerations

1. **Always use a strong SECRET_KEY**
   - Minimum 32 characters
   - Use cryptographically secure random generator

2. **Don't expose port 8000**
   - Backend should only be accessible via Nginx proxy
   - Never map `-p 8000:8000` in production

3. **Use HTTPS in production**
   - Put container behind reverse proxy (Nginx, Traefik, Caddy)
   - Use Let's Encrypt for SSL certificates

4. **Restrict database access**
   - Use firewall rules to limit PostgreSQL access
   - Use strong database passwords

5. **Regular updates**
   - Rebuild image periodically with latest base images
   - Keep dependencies updated

## Performance Tuning

### Nginx Configuration

Edit [docker/nginx.conf](docker/nginx.conf) to adjust:
- Worker processes
- Client body size limits
- Timeouts
- Cache settings

### Backend Workers

Modify [docker/supervisord.conf](docker/supervisord.conf) to run multiple Uvicorn workers:

```ini
[program:uvicorn]
command=uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
```

### Resource Limits

Limit container resources:

```bash
docker run -d \
  -p 80:80 \
  --name snake-game \
  --memory="512m" \
  --cpus="1.0" \
  -e SECRET_KEY="..." \
  snake-game:latest
```

## Monitoring

### Supervisor Status

```bash
docker exec snake-game supervisorctl status
```

### View All Logs

```bash
docker exec snake-game tail -f /var/log/supervisor/*.log
```

### Container Stats

```bash
docker stats snake-game
```
