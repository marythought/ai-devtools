// @ts-nocheck
/**
 * Tests for Snake Game Logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SnakeGame } from '../js/snake.js';

// Mock canvas
const createMockCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    return canvas;
};

describe('SnakeGame', () => {
    let game: any;
    let canvas;

    beforeEach(() => {
        canvas = createMockCanvas();
        game = new SnakeGame(canvas, {
            gridSize: 20,
            mode: 'pass-through',
            speed: 150
        });
    });

    describe('Initialization', () => {
        it('should initialize with correct grid dimensions', () => {
            expect(game.cols).toBe(30);
            expect(game.rows).toBe(30);
        });

        it('should initialize snake with length 3', () => {
            expect(game.snake.length).toBe(3);
        });

        it('should initialize snake in center', () => {
            const centerX = Math.floor(game.cols / 2);
            const centerY = Math.floor(game.rows / 2);
            expect(game.snake[0].x).toBe(centerX);
            expect(game.snake[0].y).toBe(centerY);
        });

        it('should initialize with score 0', () => {
            expect(game.score).toBe(0);
        });

        it('should spawn food', () => {
            expect(game.food).toBeDefined();
            expect(game.food.x).toBeGreaterThanOrEqual(0);
            expect(game.food.x).toBeLessThan(game.cols);
            expect(game.food.y).toBeGreaterThanOrEqual(0);
            expect(game.food.y).toBeLessThan(game.rows);
        });

        it('should not spawn food on snake', () => {
            const foodOnSnake = game.snake.some(segment =>
                segment.x === game.food.x && segment.y === game.food.y
            );
            expect(foodOnSnake).toBe(false);
        });
    });

    describe('Game Control', () => {
        it('should start game', () => {
            game.start();
            expect(game.isRunning).toBe(true);
            expect(game.gameLoop).toBeDefined();
        });

        it('should stop game', () => {
            game.start();
            game.stop();
            expect(game.isRunning).toBe(false);
            expect(game.gameLoop).toBeNull();
        });

        it('should pause and resume game', () => {
            game.start();
            game.pause();
            expect(game.isPaused).toBe(true);
            game.pause();
            expect(game.isPaused).toBe(false);
        });

        it('should reset game', () => {
            game.start();
            game.score = 50;
            game.reset();
            expect(game.isRunning).toBe(false);
            expect(game.score).toBe(0);
            expect(game.snake.length).toBe(3);
        });
    });

    describe('Direction Control', () => {
        it('should change direction', () => {
            const newDirection = { x: 0, y: 1 };
            game.changeDirection(newDirection);
            expect(game.nextDirection).toEqual(newDirection);
        });

        it('should prevent 180-degree turn', () => {
            game.direction = { x: 1, y: 0 };
            game.nextDirection = { x: 1, y: 0 };

            // Try to turn directly backwards
            game.changeDirection({ x: -1, y: 0 });
            game.update();

            // Direction should not change
            expect(game.direction.x).toBe(1);
        });
    });

    describe('Movement - Pass-Through Mode', () => {
        beforeEach(() => {
            game.setMode('pass-through');
        });

        it('should move snake forward', () => {
            const initialHead = { ...game.snake[0] };
            game.start();
            game.stop();
            game.update();

            expect(game.snake[0].x).toBe(initialHead.x + 1);
        });

        it('should wrap around right wall', () => {
            game.snake = [{ x: game.cols - 1, y: 10 }];
            game.direction = { x: 1, y: 0 };
            game.update();

            expect(game.snake[0].x).toBe(0);
            expect(game.snake[0].y).toBe(10);
        });

        it('should wrap around left wall', () => {
            game.snake = [{ x: 0, y: 10 }];
            game.direction = { x: -1, y: 0 };
            game.update();

            expect(game.snake[0].x).toBe(game.cols - 1);
            expect(game.snake[0].y).toBe(10);
        });

        it('should wrap around bottom wall', () => {
            game.snake = [{ x: 10, y: game.rows - 1 }];
            game.direction = { x: 0, y: 1 };
            game.update();

            expect(game.snake[0].x).toBe(10);
            expect(game.snake[0].y).toBe(0);
        });

        it('should wrap around top wall', () => {
            game.snake = [{ x: 10, y: 0 }];
            game.direction = { x: 0, y: -1 };
            game.update();

            expect(game.snake[0].x).toBe(10);
            expect(game.snake[0].y).toBe(game.rows - 1);
        });
    });

    describe('Movement - Walls Mode', () => {
        beforeEach(() => {
            game.setMode('walls');
            game.onGameOver = jest.fn();
        });

        it('should die on right wall', () => {
            game.snake = [{ x: game.cols - 1, y: 10 }];
            game.direction = { x: 1, y: 0 };
            game.start();
            game.update();

            expect(game.onGameOver).toHaveBeenCalledWith(game.score);
            expect(game.isRunning).toBe(false);
        });

        it('should die on left wall', () => {
            game.snake = [{ x: 0, y: 10 }];
            game.direction = { x: -1, y: 0 };
            game.start();
            game.update();

            expect(game.onGameOver).toHaveBeenCalled();
        });

        it('should die on bottom wall', () => {
            game.snake = [{ x: 10, y: game.rows - 1 }];
            game.direction = { x: 0, y: 1 };
            game.start();
            game.update();

            expect(game.onGameOver).toHaveBeenCalled();
        });

        it('should die on top wall', () => {
            game.snake = [{ x: 10, y: 0 }];
            game.direction = { x: 0, y: -1 };
            game.start();
            game.update();

            expect(game.onGameOver).toHaveBeenCalled();
        });
    });

    describe('Food Collection', () => {
        it('should grow snake when eating food', () => {
            const initialLength = game.snake.length;
            // Position snake next to food
            game.snake = [
                { x: game.food.x - 1, y: game.food.y }
            ];
            game.direction = { x: 1, y: 0 };
            game.update();

            expect(game.snake.length).toBe(initialLength + 1);
        });

        it('should increase score when eating food', () => {
            game.snake = [
                { x: game.food.x - 1, y: game.food.y }
            ];
            game.direction = { x: 1, y: 0 };
            const initialScore = game.score;
            game.update();

            expect(game.score).toBe(initialScore + 10);
        });

        it('should spawn new food after eating', () => {
            const oldFood = { ...game.food };
            game.snake = [
                { x: game.food.x - 1, y: game.food.y }
            ];
            game.direction = { x: 1, y: 0 };
            game.update();

            expect(game.food).not.toEqual(oldFood);
        });
    });

    describe('Self Collision', () => {
        it('should die on self collision', () => {
            game.onGameOver = jest.fn();
            game.start();

            // Create a scenario where snake hits itself
            game.snake = [
                { x: 5, y: 5 },
                { x: 4, y: 5 },
                { x: 4, y: 6 },
                { x: 5, y: 6 }
            ];
            game.direction = { x: 0, y: 1 };
            game.update();

            expect(game.onGameOver).toHaveBeenCalled();
        });
    });

    describe('Game State', () => {
        it('should return current state', () => {
            const state = game.getState();
            expect(state.snake).toEqual(game.snake);
            expect(state.food).toEqual(game.food);
            expect(state.direction).toEqual(game.direction);
            expect(state.score).toBe(game.score);
            expect(state.isRunning).toBe(game.isRunning);
            expect(state.mode).toBe(game.mode);
        });

        it('should return current score', () => {
            game.score = 50;
            expect(game.getScore()).toBe(50);
        });
    });

    describe('Mode Switching', () => {
        it('should switch to walls mode', () => {
            game.setMode('walls');
            expect(game.mode).toBe('walls');
            expect(game.snake.length).toBe(3); // Should reset
        });

        it('should switch to pass-through mode', () => {
            game.setMode('pass-through');
            expect(game.mode).toBe('pass-through');
        });
    });

    describe('Speed Control', () => {
        it('should change game speed', () => {
            game.setSpeed(100);
            expect(game.speed).toBe(100);
        });
    });
});
