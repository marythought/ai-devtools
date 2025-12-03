# Frontend-Backend Integration Guide

This document describes how the Snake Game frontend connects to the FastAPI backend.

## Architecture

The application follows a client-server architecture:
- **Frontend**: TypeScript/JavaScript application served via Vite
- **Backend**: FastAPI REST API with JWT authentication
- **Communication**: HTTP/JSON over REST endpoints

## API Integration

### Backend API Service

The frontend uses a centralized API client located in `frontend/js/api.ts`:

```typescript
export const api = new API("http://localhost:8000/api/v1");
```

All backend calls flow through this single instance, making it easy to:
- Manage authentication tokens
- Handle errors consistently
- Update the base URL for different environments

### Authentication Flow

1. **Signup/Login**:
   - User submits credentials
   - Backend validates and creates JWT token
   - Backend returns: `{ username, highScore, token }`
   - Frontend stores token in localStorage
   - Token automatically added to all subsequent requests

2. **Authenticated Requests**:
   - Frontend adds `Authorization: Bearer <token>` header
   - Backend validates token using HTTPBearer security
   - Backend extracts username from token payload

3. **Logout**:
   - Frontend calls logout endpoint
   - Frontend clears token from localStorage

### Endpoints Used

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/signup` | POST | No | Create new user account |
| `/auth/login` | POST | No | Authenticate user |
| `/auth/logout` | POST | Yes | End user session |
| `/auth/current` | GET | Yes | Get current user profile |
| `/leaderboard` | GET | No | Get top players |
| `/scores` | POST | Yes | Submit score |
| `/players/active` | GET | Yes | Get active players |
| `/players/{username}/state` | GET | Yes | Get player game state |

## Data Flow Example

### User Login Sequence

```
Frontend                    Backend
   |                          |
   |--- POST /auth/login ---->|
   |    {username, password}  |
   |                          |--- Validate credentials
   |                          |--- Create JWT token
   |                          |--- Store session
   |<-- 200 OK --------------|
   |    {username, highScore, token}
   |                          |
   |--- Store token in       |
   |    localStorage         |
   |                          |
```

### Authenticated Request Sequence

```
Frontend                    Backend
   |                          |
   |--- GET /auth/current --->|
   |    Authorization: Bearer token
   |                          |--- Validate JWT
   |                          |--- Decode username
   |                          |--- Get user from DB
   |<-- 200 OK --------------|
   |    {username, highScore} |
```

## Configuration

### Development

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173` (Vite default)
- CORS: Enabled for all origins in development

### Production

Update the following:
1. Set `API_BASE_URL` environment variable in frontend
2. Update CORS `allow_origins` in backend to specific domain
3. Change `SECRET_KEY` in backend to secure random value
4. Use HTTPS for all connections

## Type Safety

The frontend TypeScript interfaces match the backend Pydantic models:

**Backend (Python)**:
```python
class UserProfile(BaseModel):
    username: str
    highScore: int = Field(ge=0)
```

**Frontend (TypeScript)**:
```typescript
export interface UserProfile {
    username: string;
    highScore: number;
}
```

This ensures type consistency across the stack.

## Error Handling

The API client handles errors consistently:

```typescript
if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.detail || `HTTP error ${response.status}`);
}
```

Errors are displayed to users through the UI layer.

## Testing Integration

### Backend Tests
```bash
cd backend
uv run pytest -v
```

### Verify API
```bash
# Start backend
cd backend
uv run python main.py

# In another terminal, run verification
cd backend
uv run python verify_api.py
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Integration Test

1. Start backend:
   ```bash
   cd backend
   uv run python main.py
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open browser to `http://localhost:5173`
4. Test signup/login flow
5. Verify network tab shows API calls to `http://localhost:8000`

## Common Issues

### CORS Errors
- **Problem**: Browser blocks requests
- **Solution**: Ensure backend CORS middleware is configured
- **Check**: Backend console for CORS configuration

### Token Not Sent
- **Problem**: Authenticated endpoints return 401
- **Solution**: Check localStorage has `snake_auth_token`
- **Debug**: Check Network tab → Request Headers

### Connection Refused
- **Problem**: Frontend can't reach backend
- **Solution**: Ensure backend is running on port 8000
- **Check**: `curl http://localhost:8000/` should return API info

## Next Steps

- [ ] Add token refresh mechanism
- [ ] Implement WebSocket for real-time updates
- [ ] Add request/response interceptors for logging
- [ ] Implement retry logic for failed requests
- [ ] Add request caching for leaderboard
