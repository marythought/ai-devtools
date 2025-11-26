/**
 * Main Application Logic
 */

import { api } from './api.js';
import { SnakeGame } from './snake.js';
import { BotPlayer } from './bot.js';

class SnakeApp {
    constructor() {
        this.currentUser = null;
        this.game = null;
        this.currentBot = null;
        this.bots = new Map();

        this.init();
    }

    async init() {
        // Check if user is already logged in
        this.currentUser = api.getCurrentUser();

        if (this.currentUser) {
            this.showGameScreen();
        } else {
            this.showAuthScreen();
        }

        this.setupEventListeners();
        api.simulateActivePlayers();
    }

    setupEventListeners() {
        // Auth screen
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForms();
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForms();
        });

        document.getElementById('login-btn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('signup-btn')?.addEventListener('click', () => this.handleSignup());

        // Enter key on auth forms
        ['login-username', 'login-password'].forEach(id => {
            document.getElementById(id)?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });

        ['signup-username', 'signup-password', 'signup-confirm'].forEach(id => {
            document.getElementById(id)?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSignup();
            });
        });

        // Game screen
        document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn')?.addEventListener('click', () => this.pauseGame());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetGame());
        document.getElementById('play-again-btn')?.addEventListener('click', () => this.playAgain());

        // Mode selection
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.changeMode(e.target.value));
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Leaderboard
        document.getElementById('refresh-leaderboard')?.addEventListener('click', () => this.loadLeaderboard());
    }

    toggleAuthForms() {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        loginForm.classList.toggle('hidden');
        signupForm.classList.toggle('hidden');
        document.getElementById('auth-error').textContent = '';
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('auth-error');

        if (!username || !password) {
            errorEl.textContent = 'Please fill in all fields';
            return;
        }

        try {
            this.currentUser = await api.login(username, password);
            this.showGameScreen();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async handleSignup() {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const errorEl = document.getElementById('auth-error');

        if (!username || !password || !confirm) {
            errorEl.textContent = 'Please fill in all fields';
            return;
        }

        if (password !== confirm) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }

        try {
            this.currentUser = await api.signup(username, password);
            this.showGameScreen();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async handleLogout() {
        await api.logout();
        this.currentUser = null;
        if (this.game) {
            this.game.stop();
        }

        // Hide game over overlay if visible
        const gameOverOverlay = document.getElementById('game-over-overlay');
        if (gameOverOverlay) {
            gameOverOverlay.classList.add('hidden');
        }

        this.showAuthScreen();
    }

    showAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        const gameScreen = document.getElementById('game-screen');

        // Remove active from game screen first
        gameScreen.classList.remove('active');
        // Force reflow
        void gameScreen.offsetWidth;
        // Add active to auth screen
        authScreen.classList.add('active');

        // Scroll to top
        window.scrollTo(0, 0);
        authScreen.scrollTop = 0;

        // Clear form fields
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm').value = '';
        document.getElementById('auth-error').textContent = '';
    }

    showGameScreen() {
        const authScreen = document.getElementById('auth-screen');
        const gameScreen = document.getElementById('game-screen');

        // Remove active from auth screen first
        authScreen.classList.remove('active');
        // Force reflow
        void authScreen.offsetWidth;
        // Add active to game screen
        gameScreen.classList.add('active');

        // Scroll to top
        window.scrollTo(0, 0);
        gameScreen.scrollTop = 0;

        document.getElementById('user-display').textContent = `👤 ${this.currentUser.username}`;
        document.getElementById('high-score').textContent = this.currentUser.highScore || 0;

        // Reset game mode radio buttons to walls (default)
        const wallsRadio = document.querySelector('input[name="mode"][value="walls"]');
        if (wallsRadio) {
            wallsRadio.checked = true;
        }

        // Initialize game with walls mode as default
        const canvas = document.getElementById('game-canvas');
        this.game = new SnakeGame(canvas, {
            gridSize: 20,
            mode: 'walls',
            speed: 150
        });

        this.game.onGameOver = (score) => this.onGameOver(score);

        // Load initial data
        this.loadLeaderboard();
        this.loadActivePlayers();
    }

    startGame() {
        if (!this.game) return;
        this.game.start();
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        this.updateScoreDisplay();
    }

    pauseGame() {
        if (!this.game) return;
        this.game.pause();
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.game.isPaused ? 'Resume' : 'Pause';
    }

    resetGame() {
        if (!this.game) return;
        this.game.reset();
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').textContent = 'Pause';
        document.getElementById('game-over-overlay').classList.add('hidden');
        this.updateScoreDisplay();
    }

    playAgain() {
        this.resetGame();
        this.startGame();
    }

    changeMode(mode) {
        if (!this.game) return;
        this.game.setMode(mode);
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
    }

    handleKeyPress(e) {
        if (!this.game) return;

        // Spacebar to start, pause, or play again
        if (e.key === ' ') {
            e.preventDefault();

            // Check if game over overlay is visible
            const gameOverOverlay = document.getElementById('game-over-overlay');
            if (!gameOverOverlay.classList.contains('hidden')) {
                this.playAgain();
                return;
            }

            // Otherwise, start or pause the game
            if (!this.game.isRunning) {
                this.startGame();
            } else {
                this.pauseGame();
            }
            return;
        }

        // Arrow keys only work when game is running
        if (!this.game.isRunning) return;

        const keyMap = {
            'ArrowUp': { x: 0, y: -1 },
            'ArrowDown': { x: 0, y: 1 },
            'ArrowLeft': { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 }
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            this.game.changeDirection(keyMap[e.key]);
        }
    }

    updateScoreDisplay() {
        if (!this.game) return;
        document.getElementById('current-score').textContent = this.game.getScore();

        // Update score periodically while game is running
        if (this.game.isRunning) {
            setTimeout(() => this.updateScoreDisplay(), 100);
        }
    }

    async onGameOver(score) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;

        // Update high score
        if (score > this.currentUser.highScore) {
            await api.updateScore(this.currentUser.username, score);
            this.currentUser.highScore = score;
            document.getElementById('high-score').textContent = score;
            await this.loadLeaderboard();
        }
    }

    async loadLeaderboard() {
        const leaderboard = await api.getLeaderboard();
        const listEl = document.getElementById('leaderboard-list');
        listEl.innerHTML = '';

        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="leaderboard-rank ${index < 3 ? 'top3' : ''}">#${index + 1}</span>
                <span class="leaderboard-user">${entry.username}</span>
                <span class="leaderboard-score">${entry.score}</span>
            `;
            listEl.appendChild(item);
        });
    }

    async loadActivePlayers() {
        const players = await api.getActivePlayers();
        const listEl = document.getElementById('active-players-list');
        listEl.innerHTML = '';

        players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'player-item';
            item.innerHTML = `
                <span>${player.username}</span>
                <span class="player-status">● ${player.score}</span>
            `;
            item.addEventListener('click', () => this.spectatePlayer(player.username, item));
            listEl.appendChild(item);
        });

        // Refresh periodically
        setTimeout(() => this.loadActivePlayers(), 3000);
    }

    spectatePlayer(username, itemEl) {
        // Remove active class from all items
        document.querySelectorAll('.player-item').forEach(el => el.classList.remove('active'));
        itemEl.classList.add('active');

        // Stop existing bot if any
        if (this.currentBot) {
            this.currentBot.stop();
        }

        // Create or reuse bot for this player
        if (!this.bots.has(username)) {
            const canvas = document.getElementById('spectate-canvas');
            const bot = new BotPlayer(canvas, {
                gridSize: 10,
                mode: 'pass-through',
                speed: 200
            });
            this.bots.set(username, bot);
        }

        this.currentBot = this.bots.get(username);
        this.currentBot.start();

        // Show spectate info
        document.getElementById('spectate-info').classList.remove('hidden');
        document.getElementById('spectate-username').textContent = username;

        // Update score display
        this.updateSpectateScore();
    }

    updateSpectateScore() {
        if (this.currentBot && this.currentBot.isRunning) {
            document.getElementById('spectate-score').textContent = this.currentBot.getScore();
            setTimeout(() => this.updateSpectateScore(), 100);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Stop bot when switching away from spectate tab
        if (tabName !== 'spectate' && this.currentBot) {
            this.currentBot.stop();
            this.currentBot = null;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnakeApp();
});
