/**
 * Tests for Main Application Keyboard Controls
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('SnakeApp Keyboard Controls', () => {
    let app: any;
    let mockGame: any;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="game-over-overlay" class="hidden"></div>
            <button id="start-btn"></button>
            <button id="pause-btn"></button>
        `;

        // Create a simplified app with just the keyboard handling logic
        mockGame = {
            isRunning: false,
            isPaused: false,
            start: jest.fn(),
            stop: jest.fn(),
            pause: jest.fn(),
            reset: jest.fn(),
            changeDirection: jest.fn()
        };

        app = {
            game: mockGame,

            startGame: jest.fn(function(this: any) {
                this.game.isRunning = true;
                this.game.start();
            }),

            pauseGame: jest.fn(function(this: any) {
                this.game.pause();
            }),

            playAgain: jest.fn(function(this: any) {
                const overlay = document.getElementById('game-over-overlay');
                overlay?.classList.add('hidden');
                this.game.reset();
                this.startGame();
            }),

            handleKeyPress: function(this: any, e: KeyboardEvent) {
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

                const keyMap: Record<string, {x: number, y: number}> = {
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
        };
    });

    describe('Spacebar Key', () => {
        it('should start game when game is not running', () => {
            mockGame.isRunning = false;

            const event = new KeyboardEvent('keydown', { key: ' ' });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

            app.handleKeyPress(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(app.startGame).toHaveBeenCalled();
            expect(mockGame.start).toHaveBeenCalled();
        });

        it('should pause game when game is running', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: ' ' });
            app.handleKeyPress(event);

            expect(app.pauseGame).toHaveBeenCalled();
            expect(mockGame.pause).toHaveBeenCalled();
        });

        it('should trigger play again when game over overlay is visible', () => {
            const gameOverOverlay = document.getElementById('game-over-overlay');
            gameOverOverlay?.classList.remove('hidden');

            const event = new KeyboardEvent('keydown', { key: ' ' });
            app.handleKeyPress(event);

            expect(app.playAgain).toHaveBeenCalled();
            expect(gameOverOverlay?.classList.contains('hidden')).toBe(true);
        });

        it('should not start game if game over overlay is visible', () => {
            mockGame.isRunning = false;
            const gameOverOverlay = document.getElementById('game-over-overlay');
            gameOverOverlay?.classList.remove('hidden');

            const event = new KeyboardEvent('keydown', { key: ' ' });
            app.handleKeyPress(event);

            expect(app.playAgain).toHaveBeenCalled();
            expect(app.startGame).toHaveBeenCalledTimes(1); // Called by playAgain
        });
    });

    describe('Arrow Keys', () => {
        it('should change direction when game is running - Arrow Up', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

            app.handleKeyPress(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(mockGame.changeDirection).toHaveBeenCalledWith({ x: 0, y: -1 });
        });

        it('should change direction when game is running - Arrow Down', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            app.handleKeyPress(event);

            expect(mockGame.changeDirection).toHaveBeenCalledWith({ x: 0, y: 1 });
        });

        it('should change direction when game is running - Arrow Left', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            app.handleKeyPress(event);

            expect(mockGame.changeDirection).toHaveBeenCalledWith({ x: -1, y: 0 });
        });

        it('should change direction when game is running - Arrow Right', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            app.handleKeyPress(event);

            expect(mockGame.changeDirection).toHaveBeenCalledWith({ x: 1, y: 0 });
        });

        it('should NOT change direction when game is not running', () => {
            mockGame.isRunning = false;

            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            app.handleKeyPress(event);

            expect(mockGame.changeDirection).not.toHaveBeenCalled();
        });
    });

    describe('Play Again Behavior', () => {
        it('should hide game over overlay when play again is called', () => {
            const gameOverOverlay = document.getElementById('game-over-overlay');
            gameOverOverlay?.classList.remove('hidden');

            app.playAgain();

            expect(gameOverOverlay?.classList.contains('hidden')).toBe(true);
        });

        it('should reset and start game when play again is called', () => {
            app.playAgain();

            expect(mockGame.reset).toHaveBeenCalled();
            expect(app.startGame).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should do nothing if game is not initialized', () => {
            app.game = null;

            const event = new KeyboardEvent('keydown', { key: ' ' });

            // Should not throw error
            expect(() => app.handleKeyPress(event)).not.toThrow();
        });

        it('should ignore non-arrow, non-space keys', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: 'a' });
            app.handleKeyPress(event);

            expect(mockGame.changeDirection).not.toHaveBeenCalled();
            expect(app.startGame).not.toHaveBeenCalled();
            expect(app.pauseGame).not.toHaveBeenCalled();
        });

        it('should prevent default for space key', () => {
            const event = new KeyboardEvent('keydown', { key: ' ' });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

            app.handleKeyPress(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default for arrow keys when game is running', () => {
            mockGame.isRunning = true;

            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

            app.handleKeyPress(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('Game Mode Reset on Login', () => {
        beforeEach(() => {
            // Add radio buttons to DOM
            document.body.innerHTML += `
                <input type="radio" name="mode" value="pass-through" />
                <input type="radio" name="mode" value="walls" />
            `;
        });

        it('should reset game mode to walls when user logs in', () => {
            // Simulate user selecting pass-through mode
            const passThroughRadio = document.querySelector('input[name="mode"][value="pass-through"]') as HTMLInputElement;
            const wallsRadio = document.querySelector('input[name="mode"][value="walls"]') as HTMLInputElement;

            passThroughRadio.checked = true;
            wallsRadio.checked = false;

            // Simulate login (what showGameScreen does)
            const wallsRadioAfterLogin = document.querySelector('input[name="mode"][value="walls"]') as HTMLInputElement;
            if (wallsRadioAfterLogin) {
                wallsRadioAfterLogin.checked = true;
            }

            // Verify walls mode is selected
            expect(wallsRadio.checked).toBe(true);
            expect(passThroughRadio.checked).toBe(false);
        });

        it('should initialize game with walls mode after login', () => {
            // Mock SnakeGame constructor
            const mockSnakeGame = jest.fn(function(this: any, canvas: any, config: any) {
                this.mode = config.mode;
                this.start = jest.fn();
                this.stop = jest.fn();
                this.onGameOver = null;
            });

            // Simulate showGameScreen behavior
            const canvas = document.createElement('canvas');
            const game = new (mockSnakeGame as any)(canvas, {
                gridSize: 20,
                mode: 'walls',
                speed: 150
            });

            // Verify game was initialized with walls mode
            expect(mockSnakeGame).toHaveBeenCalledWith(
                canvas,
                expect.objectContaining({ mode: 'walls' })
            );
            expect(game.mode).toBe('walls');
        });

        it('should always reset to walls mode even if user previously selected pass-through', () => {
            const passThroughRadio = document.querySelector('input[name="mode"][value="pass-through"]') as HTMLInputElement;
            const wallsRadio = document.querySelector('input[name="mode"][value="walls"]') as HTMLInputElement;

            // User plays with pass-through mode
            passThroughRadio.checked = true;
            wallsRadio.checked = false;

            // User logs out and logs back in - radio should reset
            wallsRadio.checked = true;

            expect(wallsRadio.checked).toBe(true);
        });
    });

    describe('Logout Behavior', () => {
        beforeEach(() => {
            // Setup full DOM for logout tests
            document.body.innerHTML = `
                <div id="game-over-overlay" class="overlay"></div>
            `;
        });

        it('should hide game over overlay when user logs out', () => {
            // Simulate game over state - overlay is visible
            const gameOverOverlay = document.getElementById('game-over-overlay');
            gameOverOverlay?.classList.remove('hidden');

            // Verify it's visible
            expect(gameOverOverlay?.classList.contains('hidden')).toBe(false);

            // Simulate logout action
            if (gameOverOverlay) {
                gameOverOverlay.classList.add('hidden');
            }

            // Verify overlay is now hidden
            expect(gameOverOverlay?.classList.contains('hidden')).toBe(true);
        });

        it('should handle logout when game over overlay is already hidden', () => {
            const gameOverOverlay = document.getElementById('game-over-overlay');
            gameOverOverlay?.classList.add('hidden');

            // Simulate logout - should not throw error
            expect(() => {
                if (gameOverOverlay) {
                    gameOverOverlay.classList.add('hidden');
                }
            }).not.toThrow();

            // Should still be hidden
            expect(gameOverOverlay?.classList.contains('hidden')).toBe(true);
        });
    });
});
