"""Database layer using SQLAlchemy with SQLite."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.db_models import Base, GameSession, User


class Database:
    """Database wrapper for SQLAlchemy operations."""

    def __init__(self, database_url: str = "sqlite:///./snake_game.db"):
        """Initialize database connection."""
        self.engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},  # Needed for SQLite
            echo=False,  # Set to True for SQL query logging
        )
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

        # Create all tables
        Base.metadata.create_all(bind=self.engine)

    def get_session(self) -> Session:
        """Get a new database session."""
        return self.SessionLocal()

    def create_user(self, username: str, password_hash: str) -> bool:
        """Create a new user. Returns False if username already exists."""
        with self.get_session() as session:
            # Check if user exists
            existing_user = session.execute(
                select(User).where(User.username == username)
            ).scalar_one_or_none()

            if existing_user:
                return False

            # Create new user
            new_user = User(
                username=username, password_hash=password_hash, high_score=0
            )
            session.add(new_user)
            session.commit()
            return True

    def get_user(self, username: str) -> Optional[dict]:
        """Get user by username."""
        with self.get_session() as session:
            user = session.execute(
                select(User).where(User.username == username)
            ).scalar_one_or_none()

            if not user:
                return None

            return {"password_hash": user.password_hash, "high_score": user.high_score}

    def update_high_score(self, username: str, score: int) -> bool:
        """Update user's high score if new score is higher. Returns True if updated."""
        with self.get_session() as session:
            user = session.execute(
                select(User).where(User.username == username)
            ).scalar_one_or_none()

            if not user:
                return False

            if score > user.high_score:
                user.high_score = score
                session.commit()
                return True

            return False

    def get_leaderboard(self, limit: int = 10) -> list:
        """Get top players by high score."""
        with self.get_session() as session:
            users = session.execute(
                select(User).order_by(User.high_score.desc()).limit(limit)
            ).scalars()

            return [
                {"username": user.username, "score": user.high_score} for user in users
            ]

    def add_session(self, token: str, username: str):
        """Add or update a game session for a user."""
        with self.get_session() as session:
            # Check if session with this token already exists
            existing_session = session.execute(
                select(GameSession).where(GameSession.token == token)
            ).scalar_one_or_none()

            if existing_session:
                # Update existing session
                existing_session.username = username
                existing_session.last_active = datetime.now(timezone.utc)
            else:
                # Create new session
                new_session = GameSession(
                    username=username,
                    token=token,
                    score=0,
                    playing=False,
                    last_active=datetime.now(timezone.utc),
                )
                session.add(new_session)

            session.commit()

    def get_session_user(self, token: str) -> Optional[str]:
        """Get username by session token."""
        with self.get_session() as session:
            game_session = session.execute(
                select(GameSession).where(GameSession.token == token)
            ).scalar_one_or_none()

            return game_session.username if game_session else None

    def remove_session(self, token: str):
        """Remove a session."""
        with self.get_session() as session:
            game_session = session.execute(
                select(GameSession).where(GameSession.token == token)
            ).scalar_one_or_none()

            if game_session:
                session.delete(game_session)
                session.commit()

    def set_player_active(self, username: str, score: int = 0, playing: bool = True):
        """Mark a player as active by updating or creating their session."""
        with self.get_session() as session:
            # Find existing session for this username (get the most recent one)
            game_session = (
                session.execute(
                    select(GameSession)
                    .where(GameSession.username == username)
                    .order_by(GameSession.last_active.desc())
                )
                .scalars()
                .first()
            )

            if game_session:
                game_session.score = score
                game_session.playing = playing
                game_session.last_active = datetime.now(timezone.utc)
            else:
                # Create a temporary token if none exists
                new_session = GameSession(
                    username=username,
                    token=f"temp_{username}_{datetime.now(timezone.utc).timestamp()}",
                    score=score,
                    playing=playing,
                    last_active=datetime.now(timezone.utc),
                )
                session.add(new_session)

            session.commit()

    def get_active_players(self, exclude_username: Optional[str] = None) -> list:
        """Get all active players, optionally excluding one username."""
        with self.get_session() as session:
            query = select(GameSession)

            if exclude_username:
                query = query.where(GameSession.username != exclude_username)

            sessions = session.execute(query).scalars()

            return [
                {
                    "username": s.username,
                    "score": s.score,
                    "playing": s.playing,
                }
                for s in sessions
            ]

    def get_player_state(self, username: str) -> Optional[dict]:
        """Get game state for a specific player."""
        with self.get_session() as session:
            game_session = session.execute(
                select(GameSession).where(GameSession.username == username)
            ).scalar_one_or_none()

            if not game_session:
                return None

            return {
                "username": game_session.username,
                "score": game_session.score,
                "playing": game_session.playing,
            }

    def update_player_score(self, username: str, score: int):
        """Update active player's current score."""
        with self.get_session() as session:
            game_session = session.execute(
                select(GameSession).where(GameSession.username == username)
            ).scalar_one_or_none()

            if game_session:
                game_session.score = score
                game_session.last_active = datetime.now(timezone.utc)
                session.commit()

    def clear_all(self):
        """Clear all data from the database (for testing)."""
        with self.get_session() as session:
            session.execute(GameSession.__table__.delete())
            session.execute(User.__table__.delete())
            session.commit()


# Global database instance
db = Database()
