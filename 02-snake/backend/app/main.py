from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.models import (
    LoginRequest,
    SignupRequest,
    UserProfile,
    LeaderboardEntry,
    ActivePlayer,
    GameState,
    ScoreUpdate,
    ScoreUpdateResponse,
    LogoutResponse,
)
from app.database import db
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

app = FastAPI(
    title="Snake Game API",
    description="RESTful API for the multiplayer snake game with spectator mode",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Snake Game API", "version": "1.0.0"}


@app.post("/api/v1/auth/signup", response_model=UserProfile, status_code=201)
def signup(request: SignupRequest):
    """Create a new user account."""
    # Validate username length
    if len(request.username) < 3:
        raise HTTPException(
            status_code=400, detail="Username must be at least 3 characters"
        )

    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters"
        )

    # Hash password
    password_hash = hash_password(request.password)

    # Create user
    if not db.create_user(request.username, password_hash):
        raise HTTPException(status_code=400, detail="Username already exists")

    return UserProfile(username=request.username, highScore=0)


@app.post("/api/v1/auth/login", response_model=UserProfile)
def login(request: LoginRequest):
    """Authenticate a user with username and password."""
    # Get user from database
    user = db.get_user(request.username)

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Create access token
    access_token = create_access_token(data={"sub": request.username})

    # Store session
    db.add_session(access_token, request.username)

    # Mark user as active
    db.set_player_active(request.username, score=0, playing=False)

    return UserProfile(username=request.username, highScore=user["high_score"])


@app.post("/api/v1/auth/logout", response_model=LogoutResponse)
def logout(current_user: str = Depends(get_current_user)):
    """End the current user session."""
    # In a real implementation, we'd invalidate the token
    # For now, we just return success
    return LogoutResponse(success=True)


@app.get("/api/v1/auth/current", response_model=UserProfile)
def get_current_user_profile(current_user: str = Depends(get_current_user)):
    """Retrieve the currently authenticated user's profile."""
    user = db.get_user(current_user)

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return UserProfile(username=current_user, highScore=user["high_score"])


@app.get("/api/v1/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(limit: int = 10):
    """Retrieve the top players by high score."""
    if limit < 1 or limit > 100:
        limit = 10

    leaderboard = db.get_leaderboard(limit)
    return [LeaderboardEntry(**entry) for entry in leaderboard]


@app.post("/api/v1/scores", response_model=ScoreUpdateResponse)
def update_score(
    score_update: ScoreUpdate, current_user: str = Depends(get_current_user)
):
    """Submit a new score for the current user."""
    # Verify the username matches the authenticated user
    if score_update.username != current_user:
        raise HTTPException(status_code=400, detail="Username mismatch")

    # Validate score
    if score_update.score < 0:
        raise HTTPException(status_code=400, detail="Score must be non-negative")

    # Update high score
    updated = db.update_high_score(current_user, score_update.score)

    # Update active player score
    db.update_player_score(current_user, score_update.score)

    # Get the new high score
    user = db.get_user(current_user)
    new_high_score = user["high_score"] if user else score_update.score

    return ScoreUpdateResponse(
        success=True, updated=updated, newHighScore=new_high_score
    )


@app.get("/api/v1/players/active", response_model=List[ActivePlayer])
def get_active_players(current_user: str = Depends(get_current_user)):
    """Retrieve list of currently active players (excludes current user)."""
    active_players = db.get_active_players(exclude_username=current_user)
    return [ActivePlayer(**player) for player in active_players]


@app.get("/api/v1/players/{username}/state", response_model=GameState)
def get_player_game_state(username: str, current_user: str = Depends(get_current_user)):
    """Retrieve the current game state for a specific player (for spectator mode)."""
    player_state = db.get_player_state(username)

    if player_state is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return GameState(**player_state)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
