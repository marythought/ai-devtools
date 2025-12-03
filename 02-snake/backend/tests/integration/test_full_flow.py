"""Integration tests for complete user flows."""

from fastapi.testclient import TestClient


class TestUserRegistrationAndAuth:
    """Test complete user registration and authentication flow."""

    def test_register_login_flow(self, client: TestClient):
        """Test user can register and then login."""
        # Register a new user
        register_response = client.post(
            "/api/v1/auth/signup",
            json={"username": "testuser", "password": "testpass123"},
        )
        assert register_response.status_code == 201
        data = register_response.json()
        assert data["username"] == "testuser"
        assert "token" in data
        assert data["highScore"] == 0

        # Login with the registered user
        login_response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        assert login_response.status_code == 200
        data = login_response.json()
        assert "token" in data
        assert data["username"] == "testuser"

    def test_duplicate_registration(self, client: TestClient):
        """Test that duplicate username registration fails."""
        # Register first user
        client.post(
            "/api/v1/auth/signup", json={"username": "duplicate", "password": "pass123"}
        )

        # Try to register again with same username
        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "duplicate", "password": "different"},
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials fails."""
        # Register user
        client.post(
            "/api/v1/auth/signup",
            json={"username": "validuser", "password": "validpass"},
        )

        # Try to login with wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "validuser", "password": "wrongpass"},
        )
        assert response.status_code == 401
        assert "password" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user fails."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "nonexistent", "password": "password"},
        )
        assert response.status_code == 401
        assert "not found" in response.json()["detail"].lower()


class TestGameScoreFlow:
    """Test complete game score submission and high score tracking."""

    def test_score_submission_updates_high_score(self, client: TestClient):
        """Test that submitting scores updates the high score correctly."""
        # Register and login
        client.post(
            "/api/v1/auth/signup", json={"username": "player1", "password": "pass123"}
        )
        login_response = client.post(
            "/api/v1/auth/login", json={"username": "player1", "password": "pass123"}
        )
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Submit first score
        response1 = client.post(
            "/api/v1/scores",
            json={"username": "player1", "score": 100},
            headers=headers,
        )
        assert response1.status_code == 200
        assert response1.json()["newHighScore"] == 100
        assert response1.json()["updated"] is True

        # Submit lower score
        response2 = client.post(
            "/api/v1/scores", json={"username": "player1", "score": 50}, headers=headers
        )
        assert response2.status_code == 200
        assert response2.json()["newHighScore"] == 100
        assert response2.json()["updated"] is False

        # Submit higher score
        response3 = client.post(
            "/api/v1/scores",
            json={"username": "player1", "score": 150},
            headers=headers,
        )
        assert response3.status_code == 200
        assert response3.json()["newHighScore"] == 150
        assert response3.json()["updated"] is True

    def test_score_submission_requires_auth(self, client: TestClient):
        """Test that score submission requires authentication."""
        response = client.post(
            "/api/v1/scores", json={"username": "test", "score": 100}
        )
        assert response.status_code == 401


class TestLeaderboardFlow:
    """Test leaderboard functionality with multiple users."""

    def test_leaderboard_with_multiple_users(self, client: TestClient):
        """Test leaderboard shows users ranked by high score."""
        # Create and score multiple users
        users = [
            ("player1", "pass123", 100),
            ("player2", "pass123", 250),
            ("player3", "pass123", 150),
            ("player4", "pass123", 300),
            ("player5", "pass123", 200),
        ]

        for username, password, score in users:
            # Register and login
            client.post(
                "/api/v1/auth/signup", json={"username": username, "password": password}
            )
            login_response = client.post(
                "/api/v1/auth/login", json={"username": username, "password": password}
            )
            token = login_response.json()["token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Submit score
            client.post(
                "/api/v1/scores",
                json={"username": username, "score": score},
                headers=headers,
            )

        # Get leaderboard
        response = client.get("/api/v1/leaderboard")
        assert response.status_code == 200

        leaderboard = response.json()
        assert len(leaderboard) == 5

        # Verify correct order (highest to lowest)
        assert leaderboard[0]["username"] == "player4"
        assert leaderboard[0]["score"] == 300
        assert leaderboard[1]["username"] == "player2"
        assert leaderboard[1]["score"] == 250
        assert leaderboard[2]["username"] == "player5"
        assert leaderboard[2]["score"] == 200
        assert leaderboard[3]["username"] == "player3"
        assert leaderboard[3]["score"] == 150
        assert leaderboard[4]["username"] == "player1"
        assert leaderboard[4]["score"] == 100

    def test_leaderboard_limit(self, client: TestClient):
        """Test leaderboard respects limit parameter."""
        # Create 12 users
        for i in range(12):
            username = f"user{i}"
            password = f"pass123{i}"
            score = (i + 1) * 10

            client.post(
                "/api/v1/auth/signup", json={"username": username, "password": password}
            )
            login_response = client.post(
                "/api/v1/auth/login", json={"username": username, "password": password}
            )
            token = login_response.json()["token"]
            headers = {"Authorization": f"Bearer {token}"}
            client.post(
                "/api/v1/scores",
                json={"username": username, "score": score},
                headers=headers,
            )

        # Get default leaderboard (limit=10)
        response = client.get("/api/v1/leaderboard")
        assert response.status_code == 200
        assert len(response.json()) == 10

        # Get leaderboard with limit=5
        response = client.get("/api/v1/leaderboard?limit=5")
        assert response.status_code == 200
        assert len(response.json()) == 5

        # Verify top 5 are correct
        leaderboard = response.json()
        assert leaderboard[0]["username"] == "user11"
        assert leaderboard[0]["score"] == 120


class TestActivePlayersFlow:
    """Test active players tracking functionality."""

    def test_active_players_tracking(self, client: TestClient):
        """Test active players are tracked correctly."""
        # Create two users
        client.post(
            "/api/v1/auth/signup", json={"username": "active1", "password": "pass123"}
        )
        client.post(
            "/api/v1/auth/signup", json={"username": "active2", "password": "pass123"}
        )

        # Login both users
        login1 = client.post(
            "/api/v1/auth/login", json={"username": "active1", "password": "pass123"}
        )
        login2 = client.post(
            "/api/v1/auth/login", json={"username": "active2", "password": "pass123"}
        )

        token1 = login1.json()["token"]
        token2 = login2.json()["token"]

        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Both users are already set as active upon login, but let's update their scores
        client.post(
            "/api/v1/scores",
            json={"username": "active1", "score": 50},
            headers=headers1,
        )
        client.post(
            "/api/v1/scores",
            json={"username": "active2", "score": 75},
            headers=headers2,
        )

        # Get active players for player1 (should not include player1)
        response = client.get("/api/v1/players/active", headers=headers1)
        assert response.status_code == 200
        active_players = response.json()
        assert len(active_players) == 1
        assert active_players[0]["username"] == "active2"
        assert active_players[0]["score"] == 75
        assert (
            active_players[0]["playing"] is False
        )  # Not playing after score submission

        # Get active players for player2 (should not include player2)
        response = client.get("/api/v1/players/active", headers=headers2)
        assert response.status_code == 200
        active_players = response.json()
        assert len(active_players) == 1
        assert active_players[0]["username"] == "active1"
        assert active_players[0]["score"] == 50


class TestCompleteGameSession:
    """Test complete game session from start to finish."""

    def test_full_game_session(self, client: TestClient):
        """Test a complete game session flow."""
        # 1. Register
        register_response = client.post(
            "/api/v1/auth/signup", json={"username": "gamer", "password": "gamepass"}
        )
        assert register_response.status_code == 201

        # 2. Login
        login_response = client.post(
            "/api/v1/auth/login", json={"username": "gamer", "password": "gamepass"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. User is already set as active upon login/signup

        # 4. Play game and submit scores
        score_response1 = client.post(
            "/api/v1/scores", json={"username": "gamer", "score": 50}, headers=headers
        )
        assert score_response1.status_code == 200

        score_response2 = client.post(
            "/api/v1/scores", json={"username": "gamer", "score": 100}, headers=headers
        )
        assert score_response2.status_code == 200

        # 5. Game ends - submit final score
        score_response = client.post(
            "/api/v1/scores", json={"username": "gamer", "score": 150}, headers=headers
        )
        assert score_response.status_code == 200
        assert score_response.json()["newHighScore"] == 150
        assert score_response.json()["updated"] is True

        # 6. Check leaderboard
        leaderboard_response = client.get("/api/v1/leaderboard")
        assert leaderboard_response.status_code == 200
        leaderboard = leaderboard_response.json()
        assert any(
            player["username"] == "gamer" and player["score"] == 150
            for player in leaderboard
        )

        # 7. Play again with higher score
        score_response2 = client.post(
            "/api/v1/scores", json={"username": "gamer", "score": 200}, headers=headers
        )
        assert score_response2.status_code == 200
        assert score_response2.json()["newHighScore"] == 200
        assert score_response2.json()["updated"] is True

        # 8. Verify leaderboard updated
        leaderboard_response2 = client.get("/api/v1/leaderboard")
        assert leaderboard_response2.status_code == 200
        leaderboard2 = leaderboard_response2.json()
        assert any(
            player["username"] == "gamer" and player["score"] == 200
            for player in leaderboard2
        )


class TestDatabasePersistence:
    """Test that data persists correctly in the database."""

    def test_data_persists_across_requests(self, client: TestClient):
        """Test that data persists in database across multiple requests."""
        # Create user
        client.post(
            "/api/v1/auth/signup",
            json={"username": "persistent", "password": "pass123"},
        )

        # Login and submit score
        login_response = client.post(
            "/api/v1/auth/login", json={"username": "persistent", "password": "pass123"}
        )
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        client.post(
            "/api/v1/scores",
            json={"username": "persistent", "score": 500},
            headers=headers,
        )

        # Login again (simulating new session)
        login_response2 = client.post(
            "/api/v1/auth/login", json={"username": "persistent", "password": "pass123"}
        )
        token2 = login_response2.json()["token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Submit lower score - should retain high score from before
        score_response = client.post(
            "/api/v1/scores",
            json={"username": "persistent", "score": 100},
            headers=headers2,
        )
        assert score_response.status_code == 200
        assert score_response.json()["newHighScore"] == 500
        assert score_response.json()["updated"] is False
