// @ts-nocheck
/**
 * Tests for AI Bot Player
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BotPlayer } from '../js/bot.js';

const createMockCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    return canvas;
};

describe('BotPlayer', () => {
    let bot: any;
    let canvas;

    beforeEach(() => {
        canvas = createMockCanvas();
        bot = new BotPlayer(canvas, {
            gridSize: 10,
            mode: 'pass-through',
            speed: 200
        });
    });

    describe('Initialization', () => {
        it('should initialize with correct dimensions', () => {
            expect(bot.cols).toBe(30);
            expect(bot.rows).toBe(30);
        });

        it('should initialize snake', () => {
            expect(bot.snake.length).toBe(3);
        });

        it('should initialize in center', () => {
            const centerX = Math.floor(bot.cols / 2);
            const centerY = Math.floor(bot.rows / 2);
            expect(bot.snake[0].x).toBe(centerX);
            expect(bot.snake[0].y).toBe(centerY);
        });

        it('should spawn food', () => {
            expect(bot.food).toBeDefined();
        });
    });

    describe('Game Control', () => {
        it('should start bot', () => {
            bot.start();
            expect(bot.isRunning).toBe(true);
            expect(bot.gameLoop).toBeDefined();
        });

        it('should stop bot', () => {
            bot.start();
            bot.stop();
            expect(bot.isRunning).toBe(false);
            expect(bot.gameLoop).toBeNull();
        });

        it('should reset bot', () => {
            bot.start();
            bot.score = 50;
            bot.reset();
            expect(bot.isRunning).toBe(false);
            expect(bot.score).toBe(0);
        });
    });

    describe('AI Decision Making', () => {
        it('should make AI decision', () => {
            bot.makeAIDecision();
            // Direction may or may not change depending on food position
            expect(bot.direction).toBeDefined();
        });

        it('should move towards food', () => {
            // Place food to the right
            bot.snake = [{ x: 10, y: 10 }];
            bot.food = { x: 15, y: 10 };
            bot.direction = { x: 1, y: 0 };

            bot.makeAIDecision();
            // Should try to move right
            expect(bot.direction.x).toBeGreaterThanOrEqual(0);
        });

        it('should avoid walls in walls mode', () => {
            bot.mode = 'walls';
            // Place bot near wall
            bot.snake = [
                { x: bot.cols - 1, y: 10 },
                { x: bot.cols - 2, y: 10 }
            ];
            bot.direction = { x: 1, y: 0 };
            bot.food = { x: bot.cols - 3, y: 15 };

            bot.makeAIDecision();
            // Should avoid going right into wall
            expect(bot.direction.x).not.toBe(1);
        });

        it('should avoid self collision', () => {
            // Create snake about to hit itself
            bot.snake = [
                { x: 5, y: 5 },
                { x: 4, y: 5 },
                { x: 4, y: 6 },
                { x: 5, y: 6 }
            ];
            bot.direction = { x: 0, y: -1 };
            bot.food = { x: 10, y: 10 };

            bot.makeAIDecision();
            // Should choose a safe direction
            const nextHead = {
                x: bot.snake[0].x + bot.direction.x,
                y: bot.snake[0].y + bot.direction.y
            };
            const wouldCollide = bot.checkCollision(nextHead, bot.snake);
            expect(wouldCollide).toBe(false);
        });
    });

    describe('Bot Behavior', () => {
        it('should collect food', () => {
            bot.snake = [{ x: bot.food.x - 1, y: bot.food.y }];
            bot.direction = { x: 1, y: 0 };
            const initialScore = bot.score;
            bot.isRunning = true;

            // Mock makeAIDecision to not change direction
            bot.makeAIDecision = jest.fn();

            bot.update();

            expect(bot.score).toBeGreaterThan(initialScore);
        });

        it('should grow when eating food', () => {
            bot.snake = [{ x: bot.food.x - 1, y: bot.food.y }];
            const initialLength = bot.snake.length; // Get length AFTER positioning
            bot.direction = { x: 1, y: 0 };
            bot.isRunning = true;

            // Mock makeAIDecision to not change direction
            bot.makeAIDecision = jest.fn();

            bot.update();

            expect(bot.snake.length).toBe(initialLength + 1);
        });

        it('should reset on collision in walls mode', () => {
            bot.mode = 'walls';
            bot.snake = [{ x: bot.cols - 1, y: 10 }];
            bot.direction = { x: 1, y: 0 };
            bot.start();

            bot.update();

            // Should have reset
            expect(bot.score).toBe(0);
        });
    });

    describe('State Management', () => {
        it('should return current state', () => {
            const state = bot.getState();
            expect(state.snake).toEqual(bot.snake);
            expect(state.food).toEqual(bot.food);
            expect(state.score).toBe(bot.score);
            expect(state.isRunning).toBe(bot.isRunning);
        });

        it('should return current score', () => {
            bot.score = 75;
            expect(bot.getScore()).toBe(75);
        });
    });

    describe('Collision Detection', () => {
        it('should detect collision', () => {
            const pos = { x: 5, y: 5 };
            const snakeArray = [
                { x: 5, y: 5 },
                { x: 4, y: 5 }
            ];
            expect(bot.checkCollision(pos, snakeArray)).toBe(true);
        });

        it('should not detect collision when no overlap', () => {
            const pos = { x: 10, y: 10 };
            const snakeArray = [
                { x: 5, y: 5 },
                { x: 4, y: 5 }
            ];
            expect(bot.checkCollision(pos, snakeArray)).toBe(false);
        });
    });

    describe('Food Spawning', () => {
        it('should not spawn food on snake', () => {
            bot.spawnFood();
            const foodOnSnake = bot.checkCollision(bot.food, bot.snake);
            expect(foodOnSnake).toBe(false);
        });

        it('should spawn food within bounds', () => {
            bot.spawnFood();
            expect(bot.food.x).toBeGreaterThanOrEqual(0);
            expect(bot.food.x).toBeLessThan(bot.cols);
            expect(bot.food.y).toBeGreaterThanOrEqual(0);
            expect(bot.food.y).toBeLessThan(bot.rows);
        });
    });
});
