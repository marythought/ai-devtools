from typing import Dict, Optional
from datetime import datetime


class MockDatabase:
    def __init__(self):
        # Store users: username -> {password: str, high_score: int}
        self.users: Dict[str, dict] = {}

        # Store active players: username -> {score: int, playing: bool, last_active: datetime}
        self.active_players: Dict[str, dict] = {}

        # Store active sessions: token -> username
        self.sessions: Dict[str, str] = {}

    def create_user(self, username: str, password_hash: str) -> bool:
        """Create a new user. Returns False if username already exists."""
        if username in self.users:
            return False
        self.users[username] = {"password_hash": password_hash, "high_score": 0}
        return True

    def get_user(self, username: str) -> Optional[dict]:
        """Get user by username."""
        return self.users.get(username)

    def update_high_score(self, username: str, score: int) -> bool:
        """Update user's high score if new score is higher. Returns True if updated."""
        if username not in self.users:
            return False

        current_high = self.users[username]["high_score"]
        if score > current_high:
            self.users[username]["high_score"] = score
            return True
        return False

    def get_leaderboard(self, limit: int = 10) -> list:
        """Get top players by high score."""
        sorted_users = sorted(
            self.users.items(), key=lambda x: x[1]["high_score"], reverse=True
        )
        return [
            {"username": username, "score": data["high_score"]}
            for username, data in sorted_users[:limit]
        ]

    def add_session(self, token: str, username: str):
        """Add a session for a user."""
        self.sessions[token] = username

    def get_session(self, token: str) -> Optional[str]:
        """Get username by session token."""
        return self.sessions.get(token)

    def remove_session(self, token: str):
        """Remove a session."""
        self.sessions.pop(token, None)

    def set_player_active(self, username: str, score: int = 0, playing: bool = True):
        """Mark a player as active."""
        self.active_players[username] = {
            "score": score,
            "playing": playing,
            "last_active": datetime.now(),
        }

    def get_active_players(self, exclude_username: Optional[str] = None) -> list:
        """Get all active players, optionally excluding one username."""
        return [
            {"username": username, "score": data["score"], "playing": data["playing"]}
            for username, data in self.active_players.items()
            if username != exclude_username
        ]

    def get_player_state(self, username: str) -> Optional[dict]:
        """Get game state for a specific player."""
        if username not in self.active_players:
            return None
        data = self.active_players[username]
        return {
            "username": username,
            "score": data["score"],
            "playing": data["playing"],
        }

    def update_player_score(self, username: str, score: int):
        """Update active player's current score."""
        if username in self.active_players:
            self.active_players[username]["score"] = score


# Global database instance
db = MockDatabase()
