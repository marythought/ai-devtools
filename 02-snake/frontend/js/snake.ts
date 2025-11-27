/**
 * Snake Game Logic
 * Supports two modes: pass-through (walls wrap) and walls (classic death on collision)
 */

// Type Definitions
export interface Position {
    x: number;
    y: number;
}

export interface GameConfig {
    gridSize?: number;
    mode?: 'pass-through' | 'walls';
    speed?: number;
}

export interface GameColors {
    snake: string;
    snakeHead: string;
    food: string;
    grid: string;
}

export interface GameState {
    snake: Position[];
    food: Position;
    direction: Position;
    score: number;
    isRunning: boolean;
    isPaused: boolean;
    mode: 'pass-through' | 'walls';
}

export class SnakeGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridSize: number;
    private width: number;
    private height: number;
    private cols: number;
    private rows: number;

    private snake: Position[];
    private direction: Position;
    private nextDirection: Position;
    private food: Position | null;
    private score: number;
    public isRunning: boolean;
    public isPaused: boolean;
    private mode: 'pass-through' | 'walls';
    private speed: number;
    private gameLoop: NodeJS.Timeout | null;
    private colors: GameColors;

    public onGameOver: ((score: number) => void) | null;

    constructor(canvas: HTMLCanvasElement, config: GameConfig = {}) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.ctx = ctx;
        this.gridSize = config.gridSize || 20;
        this.width = canvas.width;
        this.height = canvas.height;
        this.cols = this.width / this.gridSize;
        this.rows = this.height / this.gridSize;

        // Game state
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = null;
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.mode = config.mode || 'pass-through';
        this.speed = config.speed || 150;
        this.gameLoop = null;
        this.onGameOver = null;

        // Colors
        this.colors = {
            snake: '#4caf50',
            snakeHead: '#2e7d32',
            food: '#f44336',
            grid: '#e0e0e0'
        };

        this.init();
    }

    private init(): void {
        // Initialize snake in the center, length 3
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.spawnFood();
        this.draw();
    }

    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    pause(): void {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
    }

    stop(): void {
        this.isRunning = false;
        this.isPaused = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    reset(): void {
        this.stop();
        this.init();
    }

    setMode(mode: 'pass-through' | 'walls'): void {
        this.mode = mode;
        this.reset();
    }

    setSpeed(speed: number): void {
        this.speed = speed;
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    update(): void {
        if (this.isPaused || !this.isRunning) return;

        // Update direction (prevent 180-degree turns)
        const isOpposite = this.nextDirection.x === -this.direction.x &&
                          this.nextDirection.y === -this.direction.y;
        if (!isOpposite) {
            this.direction = { ...this.nextDirection };
        }

        // Calculate new head position
        const head: Position = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Handle boundary collision based on mode
        if (this.mode === 'pass-through') {
            // Wrap around walls
            if (head.x < 0) head.x = this.cols - 1;
            if (head.x >= this.cols) head.x = 0;
            if (head.y < 0) head.y = this.rows - 1;
            if (head.y >= this.rows) head.y = 0;
        } else {
            // Classic mode: die on wall collision
            if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
                this.gameOver();
                return;
            }
        }

        // Check self collision
        if (this.checkCollision(head, this.snake)) {
            this.gameOver();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check food collision
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            // Don't remove tail (snake grows)
        } else {
            // Remove tail (snake moves)
            this.snake.pop();
        }

        this.draw();
    }

    changeDirection(newDirection: Position): void {
        this.nextDirection = newDirection;
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

    private gameOver(): void {
        this.stop();
        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    private draw(): void {
        // Clear canvas
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

    getState(): GameState {
        return {
            snake: [...this.snake],
            food: this.food ? { ...this.food } : { x: 0, y: 0 },
            direction: { ...this.direction },
            score: this.score,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            mode: this.mode
        };
    }
}
