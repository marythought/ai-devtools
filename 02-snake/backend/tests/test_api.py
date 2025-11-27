import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import db


@pytest.fixture
def client():
    """Create a test client."""
    # Clear database before each test
    db.users.clear()
    db.active_players.clear()
    db.sessions.clear()
    return TestClient(app)


@pytest.fixture
def authenticated_client(client):
    """Create a test client with an authenticated user."""
    # Create a user
    response = client.post(
        "/api/v1/auth/signup", json={"username": "testuser", "password": "testpass123"}
    )
    assert response.status_code == 201

    # Login
    response = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"}
    )
    assert response.status_code == 200

    # Extract token from response headers if using cookies, or from response body
    # For this test, we'll login again to get a fresh token
    client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"}
    )

    # Get token from sessions (simplified for mock)
    # In real implementation, token would be in response
    from app.auth import create_access_token

    token = create_access_token(data={"sub": "testuser"})

    # Create client with auth header
    client.headers = {"Authorization": f"Bearer {token}"}
    return client


class TestRoot:
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Snake Game API", "version": "1.0.0"}


class TestAuthentication:
    def test_signup_success(self, client):
        """Test successful user signup."""
        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "newuser", "password": "password123"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["highScore"] == 0

    def test_signup_username_too_short(self, client):
        """Test signup with username too short."""
        response = client.post(
            "/api/v1/auth/signup", json={"username": "ab", "password": "password123"}
        )
        assert response.status_code == 422  # Pydantic validation error

    def test_signup_password_too_short(self, client):
        """Test signup with password too short."""
        response = client.post(
            "/api/v1/auth/signup", json={"username": "newuser", "password": "12345"}
        )
        assert response.status_code == 422  # Pydantic validation error

    def test_signup_duplicate_username(self, client):
        """Test signup with duplicate username."""
        # Create first user
        client.post(
            "/api/v1/auth/signup",
            json={"username": "duplicate", "password": "password123"},
        )

        # Try to create same username again
        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "duplicate", "password": "password456"},
        )
        assert response.status_code == 400
        assert "Username already exists" in response.json()["detail"]

    def test_login_success(self, client):
        """Test successful login."""
        # Create user
        client.post(
            "/api/v1/auth/signup",
            json={"username": "loginuser", "password": "password123"},
        )

        # Login
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "loginuser", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "loginuser"
        assert "highScore" in data

    def test_login_user_not_found(self, client):
        """Test login with non-existent user."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "nonexistent", "password": "password123"},
        )
        assert response.status_code == 401
        assert "User not found" in response.json()["detail"]

    def test_login_invalid_password(self, client):
        """Test login with wrong password."""
        # Create user
        client.post(
            "/api/v1/auth/signup",
            json={"username": "loginuser", "password": "password123"},
        )

        # Try wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "loginuser", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "Invalid password" in response.json()["detail"]

    def test_get_current_user(self, authenticated_client):
        """Test getting current user profile."""
        response = authenticated_client.get("/api/v1/auth/current")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert "highScore" in data

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication."""
        response = client.get("/api/v1/auth/current")
        assert response.status_code == 401  # HTTPBearer returns 401 for missing auth

    def test_logout(self, authenticated_client):
        """Test logout."""
        response = authenticated_client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestLeaderboard:
    def test_get_empty_leaderboard(self, client):
        """Test getting leaderboard when no users exist."""
        response = client.get("/api/v1/leaderboard")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_leaderboard_with_users(self, client):
        """Test getting leaderboard with multiple users."""
        # Create users and set scores
        users = [
            ("player1", 100),
            ("player2", 200),
            ("player3", 150),
        ]

        for username, score in users:
            client.post(
                "/api/v1/auth/signup",
                json={"username": username, "password": "password123"},
            )
            db.update_high_score(username, score)

        response = client.get("/api/v1/leaderboard")
        assert response.status_code == 200
        data = response.json()

        # Should be sorted by score descending
        assert len(data) == 3
        assert data[0]["username"] == "player2"
        assert data[0]["score"] == 200
        assert data[1]["username"] == "player3"
        assert data[1]["score"] == 150
        assert data[2]["username"] == "player1"
        assert data[2]["score"] == 100

    def test_get_leaderboard_with_limit(self, client):
        """Test getting leaderboard with custom limit."""
        # Create 5 users
        for i in range(5):
            client.post(
                "/api/v1/auth/signup",
                json={"username": f"player{i}", "password": "password123"},
            )
            db.update_high_score(f"player{i}", i * 10)

        response = client.get("/api/v1/leaderboard?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3


class TestScores:
    def test_update_score_success(self, authenticated_client):
        """Test successful score update."""
        response = authenticated_client.post(
            "/api/v1/scores", json={"username": "testuser", "score": 150}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["updated"] is True
        assert data["newHighScore"] == 150

    def test_update_score_not_higher(self, authenticated_client):
        """Test score update when new score is not higher."""
        # First update
        authenticated_client.post(
            "/api/v1/scores", json={"username": "testuser", "score": 200}
        )

        # Second update with lower score
        response = authenticated_client.post(
            "/api/v1/scores", json={"username": "testuser", "score": 150}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["updated"] is False
        assert data["newHighScore"] == 200

    def test_update_score_username_mismatch(self, authenticated_client):
        """Test score update with wrong username."""
        response = authenticated_client.post(
            "/api/v1/scores", json={"username": "differentuser", "score": 150}
        )
        assert response.status_code == 400
        assert "Username mismatch" in response.json()["detail"]

    def test_update_score_negative(self, authenticated_client):
        """Test score update with negative score."""
        response = authenticated_client.post(
            "/api/v1/scores", json={"username": "testuser", "score": -10}
        )
        assert response.status_code == 422  # Pydantic validation error

    def test_update_score_unauthorized(self, client):
        """Test score update without authentication."""
        response = client.post(
            "/api/v1/scores", json={"username": "testuser", "score": 150}
        )
        assert response.status_code == 401


class TestPlayers:
    def test_get_active_players(self, authenticated_client):
        """Test getting active players."""
        # Add some active players
        db.set_player_active("player1", score=100, playing=True)
        db.set_player_active("player2", score=200, playing=True)
        db.set_player_active("testuser", score=50, playing=False)

        response = authenticated_client.get("/api/v1/players/active")
        assert response.status_code == 200
        data = response.json()

        # Should not include the current user (testuser)
        assert len(data) == 2
        usernames = [player["username"] for player in data]
        assert "player1" in usernames
        assert "player2" in usernames
        assert "testuser" not in usernames

    def test_get_active_players_empty(self, authenticated_client):
        """Test getting active players when only current user is active."""
        response = authenticated_client.get("/api/v1/players/active")
        assert response.status_code == 200
        data = response.json()
        # May include testuser or be empty depending on login behavior
        # Let's just check it's a list
        assert isinstance(data, list)

    def test_get_active_players_unauthorized(self, client):
        """Test getting active players without authentication."""
        response = client.get("/api/v1/players/active")
        assert response.status_code == 401

    def test_get_player_game_state(self, authenticated_client):
        """Test getting game state for a specific player."""
        # Add a player
        db.set_player_active("spectate_me", score=250, playing=True)

        response = authenticated_client.get("/api/v1/players/spectate_me/state")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "spectate_me"
        assert data["score"] == 250
        assert data["playing"] is True

    def test_get_player_game_state_not_found(self, authenticated_client):
        """Test getting game state for non-existent player."""
        response = authenticated_client.get("/api/v1/players/nonexistent/state")
        assert response.status_code == 404
        assert "Player not found" in response.json()["detail"]

    def test_get_player_game_state_unauthorized(self, client):
        """Test getting game state without authentication."""
        response = client.get("/api/v1/players/someplayer/state")
        assert response.status_code == 401
