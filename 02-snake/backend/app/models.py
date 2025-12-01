from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class UserProfile(BaseModel):
    username: str
    highScore: int = Field(ge=0)


class AuthResponse(BaseModel):
    username: str
    highScore: int = Field(ge=0)
    token: str


class LeaderboardEntry(BaseModel):
    username: str
    score: int = Field(ge=0)


class ActivePlayer(BaseModel):
    username: str
    score: int = Field(ge=0)
    playing: bool


class GameState(BaseModel):
    username: str
    score: int = Field(ge=0)
    playing: bool


class ScoreUpdate(BaseModel):
    username: str
    score: int = Field(ge=0)


class ScoreUpdateResponse(BaseModel):
    success: bool
    updated: bool
    newHighScore: int


class LogoutResponse(BaseModel):
    success: bool


class ErrorResponse(BaseModel):
    error: str
