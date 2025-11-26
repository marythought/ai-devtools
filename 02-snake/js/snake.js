/**
 * Snake Game Logic
 * Supports two modes: pass-through (walls wrap) and walls (classic death on collision)
 */

export class SnakeGame {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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
        this.mode = config.mode || 'pass-through'; // 'pass-through' or 'walls'
        this.speed = config.speed || 150; // ms per frame
        this.gameLoop = null;

        // Colors
        this.colors = {
            snake: '#4caf50',
            snakeHead: '#2e7d32',
            food: '#f44336',
            grid: '#e0e0e0'
        };

        this.init();
    }

    init() {
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

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    pause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    reset() {
        this.stop();
        this.init();
    }

    setMode(mode) {
        this.mode = mode;
        this.reset();
    }

    setSpeed(speed) {
        this.speed = speed;
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    update() {
        if (this.isPaused || !this.isRunning) return;

        // Update direction (prevent 180-degree turns)
        const isOpposite = this.nextDirection.x === -this.direction.x &&
                          this.nextDirection.y === -this.direction.y;
        if (!isOpposite) {
            this.direction = { ...this.nextDirection };
        }

        // Calculate new head position
        const head = { ...this.snake[0] };
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
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            // Don't remove tail (snake grows)
        } else {
            // Remove tail (snake moves)
            this.snake.pop();
        }

        this.draw();
    }

    changeDirection(newDirection) {
        this.nextDirection = newDirection;
    }

    spawnFood() {
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
        } while (this.checkCollision(foodPosition, this.snake));

        this.food = foodPosition;
    }

    checkCollision(pos, snakeArray) {
        return snakeArray.some(segment => segment.x === pos.x && segment.y === pos.y);
    }

    gameOver() {
        this.stop();
        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    draw() {
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

    getScore() {
        return this.score;
    }

    getState() {
        return {
            snake: [...this.snake],
            food: { ...this.food },
            direction: { ...this.direction },
            score: this.score,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            mode: this.mode
        };
    }
}
