/**
 * Mock Backend API Service
 * All backend calls are centralized here for easy migration to real backend
 */

export class MockAPI {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.leaderboard = this.loadLeaderboard();
        this.activePlayers = [];
        this.initializeMockData();
    }

    // Local Storage Management
    loadUsers() {
        const users = localStorage.getItem('snake_users');
        return users ? JSON.parse(users) : {};
    }

    saveUsers() {
        localStorage.setItem('snake_users', JSON.stringify(this.users));
    }

    loadCurrentUser() {
        const user = localStorage.getItem('snake_current_user');
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser(user) {
        if (user) {
            localStorage.setItem('snake_current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('snake_current_user');
        }
        this.currentUser = user;
    }

    loadLeaderboard() {
        const leaderboard = localStorage.getItem('snake_leaderboard');
        return leaderboard ? JSON.parse(leaderboard) : [];
    }

    saveLeaderboard() {
        localStorage.setItem('snake_leaderboard', JSON.stringify(this.leaderboard));
    }

    // Initialize Mock Data
    initializeMockData() {
        // Add some mock users if none exist
        if (Object.keys(this.users).length === 0) {
            this.users = {
                'player1': { username: 'player1', password: 'pass123', highScore: 250 },
                'snakemaster': { username: 'snakemaster', password: 'pass123', highScore: 450 },
                'gamer99': { username: 'gamer99', password: 'pass123', highScore: 180 },
                'python_pro': { username: 'python_pro', password: 'pass123', highScore: 320 },
                'speedrunner': { username: 'speedrunner', password: 'pass123', highScore: 390 }
            };
            this.saveUsers();
        }

        // Initialize leaderboard
        if (this.leaderboard.length === 0) {
            this.leaderboard = Object.values(this.users)
                .map(user => ({ username: user.username, score: user.highScore }))
                .sort((a, b) => b.score - a.score);
            this.saveLeaderboard();
        }

        // Initialize active players (bots)
        this.activePlayers = [
            { username: 'snakemaster', score: 120, playing: true },
            { username: 'gamer99', score: 80, playing: true },
            { username: 'python_pro', score: 150, playing: true }
        ];
    }

    // Authentication Methods
    async login(username, password) {
        // Simulate network delay
        await this.delay(500);

        const user = this.users[username];
        if (!user) {
            throw new Error('User not found');
        }
        if (user.password !== password) {
            throw new Error('Invalid password');
        }

        const userProfile = {
            username: user.username,
            highScore: user.highScore || 0
        };
        this.saveCurrentUser(userProfile);
        return userProfile;
    }

    async signup(username, password) {
        // Simulate network delay
        await this.delay(500);

        if (this.users[username]) {
            throw new Error('Username already exists');
        }

        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const newUser = {
            username,
            password,
            highScore: 0
        };

        this.users[username] = newUser;
        this.saveUsers();

        const userProfile = {
            username: newUser.username,
            highScore: newUser.highScore
        };
        this.saveCurrentUser(userProfile);
        return userProfile;
    }

    async logout() {
        await this.delay(200);
        this.saveCurrentUser(null);
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Leaderboard Methods
    async getLeaderboard() {
        await this.delay(300);
        return [...this.leaderboard].slice(0, 10); // Top 10
    }

    async updateScore(username, score) {
        await this.delay(200);

        // Update user's high score if this is better
        if (this.users[username]) {
            if (score > (this.users[username].highScore || 0)) {
                this.users[username].highScore = score;
                this.saveUsers();

                // Update current user if it's them
                if (this.currentUser && this.currentUser.username === username) {
                    this.currentUser.highScore = score;
                    this.saveCurrentUser(this.currentUser);
                }
            }
        }

        // Update leaderboard
        const existingIndex = this.leaderboard.findIndex(entry => entry.username === username);
        if (existingIndex >= 0) {
            if (score > this.leaderboard[existingIndex].score) {
                this.leaderboard[existingIndex].score = score;
            }
        } else {
            this.leaderboard.push({ username, score });
        }

        this.leaderboard.sort((a, b) => b.score - a.score);
        this.saveLeaderboard();

        return true;
    }

    // Active Players / Spectator Methods
    async getActivePlayers() {
        await this.delay(200);
        // Filter out current user
        return this.activePlayers.filter(p =>
            !this.currentUser || p.username !== this.currentUser.username
        );
    }

    async getPlayerGameState(username) {
        await this.delay(100);
        const player = this.activePlayers.find(p => p.username === username);
        if (!player) {
            throw new Error('Player not found');
        }

        // Return mock game state
        return {
            username: player.username,
            score: player.score,
            playing: player.playing
        };
    }

    // Simulate other players' scores changing
    simulateActivePlayers() {
        setInterval(() => {
            this.activePlayers.forEach(player => {
                if (player.playing && Math.random() > 0.3) {
                    player.score += Math.floor(Math.random() * 10) + 1;
                }
                // Randomly stop/start playing
                if (Math.random() > 0.95) {
                    player.playing = !player.playing;
                    if (!player.playing) {
                        player.score = 0;
                    }
                }
            });
        }, 2000);
    }

    // Utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const api = new MockAPI();
