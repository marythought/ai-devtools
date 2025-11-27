/**
 * AI Bot for simulating other players
 * Uses simple pathfinding to move towards food
 */

import { Position, GameColors } from './snake.js';

// Type Definitions
export interface BotConfig {
    gridSize?: number;
    mode?: 'pass-through' | 'walls';
    speed?: number;
}

interface DirectionChoice {
    direction: Position;
    distance: number;
    wouldCollide: boolean;
}

export interface BotState {
    snake: Position[];
    food: Position;
    score: number;
    isRunning: boolean;
}

export class BotPlayer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridSize: number;
    private width: number;
    private height: number;
    private cols: number;
    private rows: number;

    private snake: Position[];
    private direction: Position;
    private food: Position | null;
    private score: number;
    public isRunning: boolean;
    private mode: 'pass-through' | 'walls';
    private speed: number;
    private gameLoop: NodeJS.Timeout | null;
    private colors: GameColors;

    constructor(canvas: HTMLCanvasElement, config: BotConfig = {}) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.ctx = ctx;
        this.gridSize = config.gridSize || 10;
        this.width = canvas.width;
        this.height = canvas.height;
        this.cols = this.width / this.gridSize;
        this.rows = this.height / this.gridSize;

        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.food = null;
        this.score = 0;
        this.isRunning = false;
        this.mode = config.mode || 'pass-through';
        this.speed = config.speed || 200;
        this.gameLoop = null;

        this.colors = {
            snake: '#2196f3',
            snakeHead: '#1565c0',
            food: '#ff9800',
            grid: '#e0e0e0'
        };

        this.init();
    }

    private init(): void {
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        this.direction = { x: 1, y: 0 };
        this.score = 0;
        this.spawnFood();
        this.draw();
    }

    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    stop(): void {
        this.isRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    reset(): void {
        this.stop();
        this.init();
    }

    update(): void {
        if (!this.isRunning) return;

        // AI decision: move towards food
        this.makeAIDecision();

        const head: Position = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Handle boundaries
        if (this.mode === 'pass-through') {
            if (head.x < 0) head.x = this.cols - 1;
            if (head.x >= this.cols) head.x = 0;
            if (head.y < 0) head.y = this.rows - 1;
            if (head.y >= this.rows) head.y = 0;
        } else {
            if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
                this.reset();
                this.start();
                return;
            }
        }

        // Check self collision
        if (this.checkCollision(head, this.snake)) {
            this.reset();
            this.start();
            return;
        }

        this.snake.unshift(head);

        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    private makeAIDecision(): void {
        if (!this.food) return;

        const head = this.snake[0];
        const possibleDirections: Position[] = [
            { x: 1, y: 0 },   // right
            { x: -1, y: 0 },  // left
            { x: 0, y: 1 },   // down
            { x: 0, y: -1 }   // up
        ];

        // Filter out opposite direction
        const validDirections = possibleDirections.filter(dir => {
            return !(dir.x === -this.direction.x && dir.y === -this.direction.y);
        });

        // Calculate distance to food for each direction
        const directionsWithDistance: DirectionChoice[] = validDirections.map(dir => {
            const newHead: Position = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };

            // Handle wrapping for distance calculation
            if (this.mode === 'pass-through') {
                if (newHead.x < 0) newHead.x = this.cols - 1;
                if (newHead.x >= this.cols) newHead.x = 0;
                if (newHead.y < 0) newHead.y = this.rows - 1;
                if (newHead.y >= this.rows) newHead.y = 0;
            }

            // Check if this direction would cause collision
            const wouldCollide = this.checkCollision(newHead, this.snake) ||
                                (this.mode === 'walls' && (
                                    newHead.x < 0 || newHead.x >= this.cols ||
                                    newHead.y < 0 || newHead.y >= this.rows
                                ));

            const distance = Math.abs(newHead.x - this.food!.x) + Math.abs(newHead.y - this.food!.y);

            return {
                direction: dir,
                distance,
                wouldCollide
            };
        });

        // Sort by distance, avoiding collisions
        directionsWithDistance.sort((a, b) => {
            if (a.wouldCollide && !b.wouldCollide) return 1;
            if (!a.wouldCollide && b.wouldCollide) return -1;
            return a.distance - b.distance;
        });

        // Choose best direction with some randomness
        const bestChoices = directionsWithDistance.slice(0, 2);
        const chosen = bestChoices[Math.floor(Math.random() * bestChoices.length)];

        if (chosen && !chosen.wouldCollide) {
            this.direction = chosen.direction;
        } else if (directionsWithDistance.length > 0) {
            // Emergency: pick any non-colliding direction
            const safeDirection = directionsWithDistance.find(d => !d.wouldCollide);
            if (safeDirection) {
                this.direction = safeDirection.direction;
            }
        }
    }

    private spawnFood(): void {
        let foodPosition: Position;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
        } while (this.checkCollision(foodPosition, this.snake));

        this.food = foodPosition;
    }

    private checkCollision(pos: Position, snakeArray: Position[]): boolean {
        return snakeArray.some(segment => segment.x === pos.x && segment.y === pos.y);
    }

    private draw(): void {
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.width, y * this.gridSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? this.colors.snakeHead : this.colors.snake;
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        if (this.food) {
            this.ctx.fillStyle = this.colors.food;
            this.ctx.beginPath();
            this.ctx.arc(
                this.food.x * this.gridSize + this.gridSize / 2,
                this.food.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2 - 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    getScore(): number {
        return this.score;
    }

    getState(): BotState {
        return {
            snake: [...this.snake],
            food: this.food ? { ...this.food } : { x: 0, y: 0 },
            score: this.score,
            isRunning: this.isRunning
        };
    }
}
