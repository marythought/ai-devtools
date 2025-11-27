/**
 * Main Application Logic
 */

import { api, UserProfile, LeaderboardEntry, ActivePlayer } from './api.js';
import { SnakeGame } from './snake.js';
import { BotPlayer } from './bot.js';

class SnakeApp {
    private currentUser: UserProfile | null;
    private game: SnakeGame | null;
    private currentBot: BotPlayer | null;
    private bots: Map<string, BotPlayer>;

    constructor() {
        this.currentUser = null;
        this.game = null;
        this.currentBot = null;
        this.bots = new Map();

        this.init();
    }

    async init(): Promise<void> {
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

    private setupEventListeners(): void {
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
            document.getElementById(id)?.addEventListener('keypress', (e: KeyboardEvent) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });

        ['signup-username', 'signup-password', 'signup-confirm'].forEach(id => {
            document.getElementById(id)?.addEventListener('keypress', (e: KeyboardEvent) => {
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
            radio.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.changeMode(target.value as 'pass-through' | 'walls');
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = (btn as HTMLElement).dataset.tab;
                if (tabName) this.switchTab(tabName);
            });
        });

        // Leaderboard
        document.getElementById('refresh-leaderboard')?.addEventListener('click', () => this.loadLeaderboard());
    }

    private toggleAuthForms(): void {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const errorEl = document.getElementById('auth-error');

        loginForm?.classList.toggle('hidden');
        signupForm?.classList.toggle('hidden');
        if (errorEl) errorEl.textContent = '';
    }

    private async handleLogin(): Promise<void> {
        const usernameInput = document.getElementById('login-username') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
        const errorEl = document.getElementById('auth-error');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            if (errorEl) errorEl.textContent = 'Please fill in all fields';
            return;
        }

        try {
            this.currentUser = await api.login(username, password);
            this.showGameScreen();
        } catch (error) {
            if (errorEl && error instanceof Error) {
                errorEl.textContent = error.message;
            }
        }
    }

    private async handleSignup(): Promise<void> {
        const usernameInput = document.getElementById('signup-username') as HTMLInputElement;
        const passwordInput = document.getElementById('signup-password') as HTMLInputElement;
        const confirmInput = document.getElementById('signup-confirm') as HTMLInputElement;
        const errorEl = document.getElementById('auth-error');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (!username || !password || !confirm) {
            if (errorEl) errorEl.textContent = 'Please fill in all fields';
            return;
        }

        if (password !== confirm) {
            if (errorEl) errorEl.textContent = 'Passwords do not match';
            return;
        }

        try {
            this.currentUser = await api.signup(username, password);
            this.showGameScreen();
        } catch (error) {
            if (errorEl && error instanceof Error) {
                errorEl.textContent = error.message;
            }
        }
    }

    private async handleLogout(): Promise<void> {
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

    private showAuthScreen(): void {
        const authScreen = document.getElementById('auth-screen');
        const gameScreen = document.getElementById('game-screen');

        if (!authScreen || !gameScreen) return;

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
        (document.getElementById('login-username') as HTMLInputElement).value = '';
        (document.getElementById('login-password') as HTMLInputElement).value = '';
        (document.getElementById('signup-username') as HTMLInputElement).value = '';
        (document.getElementById('signup-password') as HTMLInputElement).value = '';
        (document.getElementById('signup-confirm') as HTMLInputElement).value = '';
        const errorEl = document.getElementById('auth-error');
        if (errorEl) errorEl.textContent = '';
    }

    private showGameScreen(): void {
        const authScreen = document.getElementById('auth-screen');
        const gameScreen = document.getElementById('game-screen');

        if (!authScreen || !gameScreen || !this.currentUser) return;

        // Remove active from auth screen first
        authScreen.classList.remove('active');
        // Force reflow
        void authScreen.offsetWidth;
        // Add active to game screen
        gameScreen.classList.add('active');

        // Scroll to top
        window.scrollTo(0, 0);
        gameScreen.scrollTop = 0;

        const userDisplay = document.getElementById('user-display');
        const highScoreEl = document.getElementById('high-score');
        if (userDisplay) userDisplay.textContent = `👤 ${this.currentUser.username}`;
        if (highScoreEl) highScoreEl.textContent = String(this.currentUser.highScore || 0);

        // Reset game mode radio buttons to walls (default)
        const wallsRadio = document.querySelector('input[name="mode"][value="walls"]') as HTMLInputElement;
        if (wallsRadio) {
            wallsRadio.checked = true;
        }

        // Initialize game with walls mode as default
        const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.game = new SnakeGame(canvas, {
            gridSize: 20,
            mode: 'walls',
            speed: 150
        });

        this.game.onGameOver = (score: number) => this.onGameOver(score);

        // Load initial data
        this.loadLeaderboard();
        this.loadActivePlayers();
    }

    private startGame(): void {
        if (!this.game) return;
        this.game.start();
        const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        this.updateScoreDisplay();
    }

    private pauseGame(): void {
        if (!this.game) return;
        this.game.pause();
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
        pauseBtn.textContent = this.game.isPaused ? 'Resume' : 'Pause';
    }

    private resetGame(): void {
        if (!this.game) return;
        this.game.reset();
        const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
        const gameOverOverlay = document.getElementById('game-over-overlay');
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.textContent = 'Pause';
        gameOverOverlay?.classList.add('hidden');
        this.updateScoreDisplay();
    }

    private playAgain(): void {
        this.resetGame();
        this.startGame();
    }

    private changeMode(mode: 'pass-through' | 'walls'): void {
        if (!this.game) return;
        this.game.setMode(mode);
        const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    private handleKeyPress(e: KeyboardEvent): void {
        if (!this.game) return;

        // Spacebar to start, pause, or play again
        if (e.key === ' ') {
            e.preventDefault();

            // Check if game over overlay is visible
            const gameOverOverlay = document.getElementById('game-over-overlay');
            if (gameOverOverlay && !gameOverOverlay.classList.contains('hidden')) {
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

        const keyMap: Record<string, { x: number; y: number }> = {
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

    private updateScoreDisplay(): void {
        if (!this.game) return;
        const scoreEl = document.getElementById('current-score');
        if (scoreEl) scoreEl.textContent = String(this.game.getScore());

        // Update score periodically while game is running
        if (this.game.isRunning) {
            setTimeout(() => this.updateScoreDisplay(), 100);
        }
    }

    private async onGameOver(score: number): Promise<void> {
        const finalScoreEl = document.getElementById('final-score');
        const gameOverOverlay = document.getElementById('game-over-overlay');
        const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;

        if (finalScoreEl) finalScoreEl.textContent = String(score);
        gameOverOverlay?.classList.remove('hidden');
        startBtn.disabled = false;
        pauseBtn.disabled = true;

        // Update high score
        if (this.currentUser && score > this.currentUser.highScore) {
            await api.updateScore(this.currentUser.username, score);
            this.currentUser.highScore = score;
            const highScoreEl = document.getElementById('high-score');
            if (highScoreEl) highScoreEl.textContent = String(score);
            await this.loadLeaderboard();
        }
    }

    private async loadLeaderboard(): Promise<void> {
        const leaderboard = await api.getLeaderboard();
        const listEl = document.getElementById('leaderboard-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        leaderboard.forEach((entry: LeaderboardEntry, index: number) => {
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

    private async loadActivePlayers(): Promise<void> {
        const players = await api.getActivePlayers();
        const listEl = document.getElementById('active-players-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        players.forEach((player: ActivePlayer) => {
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

    private spectatePlayer(username: string, itemEl: HTMLElement): void {
        // Remove active class from all items
        document.querySelectorAll('.player-item').forEach(el => el.classList.remove('active'));
        itemEl.classList.add('active');

        // Stop existing bot if any
        if (this.currentBot) {
            this.currentBot.stop();
        }

        // Create or reuse bot for this player
        if (!this.bots.has(username)) {
            const canvas = document.getElementById('spectate-canvas') as HTMLCanvasElement;
            const bot = new BotPlayer(canvas, {
                gridSize: 10,
                mode: 'pass-through',
                speed: 200
            });
            this.bots.set(username, bot);
        }

        this.currentBot = this.bots.get(username)!;
        this.currentBot.start();

        // Show spectate info
        const spectateInfo = document.getElementById('spectate-info');
        const spectateUsername = document.getElementById('spectate-username');
        spectateInfo?.classList.remove('hidden');
        if (spectateUsername) spectateUsername.textContent = username;

        // Update score display
        this.updateSpectateScore();
    }

    private updateSpectateScore(): void {
        if (this.currentBot && this.currentBot.isRunning) {
            const spectateScoreEl = document.getElementById('spectate-score');
            if (spectateScoreEl) {
                spectateScoreEl.textContent = String(this.currentBot.getScore());
            }
            setTimeout(() => this.updateSpectateScore(), 100);
        }
    }

    private switchTab(tabName: string): void {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tabName);
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
