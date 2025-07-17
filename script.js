const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

const gridSize = 20;
let snake = [{ x: 10, y: 10 }];
let food = {};
let direction = 'right';
let score = 0;
let gameOver = false;
let gamePaused = true;
let gameInterval;

// NPC Snake variables
let npcSnakes = [];
const MAX_NPC_SNAKES = 3;
const NPC_COLORS = ['#e67e22', '#9b59b6', '#3498db']; // Orange, Purple, Blue

// NPC Snake class
class NPCSnake {
    constructor(x, y, color) {
        this.body = [{ x, y }];
        this.direction = this.getRandomDirection();
        this.color = color;
        this.nextDirection = this.direction;
        this.alive = true;
    }

    getRandomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    update() {
        if (!this.alive) return;

        this.direction = this.nextDirection;
        const head = { x: this.body[0].x, y: this.body[0].y };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check if NPC snake hits walls
        if (head.x < 0 || head.x >= canvas.width / gridSize || 
            head.y < 0 || head.y >= canvas.height / gridSize) {
            this.alive = false;
            return;
        }

        // Check if NPC snake hits itself
        for (let i = 0; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                this.alive = false;
                return;
            }
        }

        // Check if NPC snake hits player snake
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                this.alive = false;
                return;
            }
        }

        // Check if NPC snake hits other NPC snakes
        for (let npc of npcSnakes) {
            if (npc !== this) {
                for (let segment of npc.body) {
                    if (head.x === segment.x && head.y === segment.y) {
                        this.alive = false;
                        return;
                    }
                }
            }
        }

        this.body.unshift(head);

        // Check if NPC snake eats food
        if (head.x === food.x && head.y === food.y) {
            generateFood();
        } else {
            this.body.pop();
        }

        // Simple AI: avoid walls and try to find food
        this.makeDecision();
    }

    makeDecision() {
        if (!this.alive) return;

        const head = this.body[0];
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = [];

        // Find valid directions that won't immediately kill the snake
        for (let dir of directions) {
            let newX = head.x;
            let newY = head.y;

            switch (dir) {
                case 'up': newY--; break;
                case 'down': newY++; break;
                case 'left': newX--; break;
                case 'right': newX++; break;
            }

            // Check if new position is valid
            if (newX >= 0 && newX < canvas.width / gridSize && 
                newY >= 0 && newY < canvas.height / gridSize) {
                
                // Check if not colliding with itself
                let canMove = true;
                for (let segment of this.body) {
                    if (newX === segment.x && newY === segment.y) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove) {
                    validDirections.push(dir);
                }
            }
        }

        if (validDirections.length > 0) {
            // Simple food-seeking behavior with some randomness
            let bestDirection = validDirections[0];
            let minDistance = Infinity;

            for (let dir of validDirections) {
                let newX = head.x;
                let newY = head.y;

                switch (dir) {
                    case 'up': newY--; break;
                    case 'down': newY++; break;
                    case 'left': newX--; break;
                    case 'right': newX++; break;
                }

                let distance = Math.abs(newX - food.x) + Math.abs(newY - food.y);
                
                // 70% chance to choose direction towards food, 30% random
                if (Math.random() < 0.7 && distance < minDistance) {
                    minDistance = distance;
                    bestDirection = dir;
                } else if (Math.random() < 0.3) {
                    bestDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
                }
            }

            this.nextDirection = bestDirection;
        }
    }
}

// --- NEW DRAWING FUNCTIONS ---

function drawCheckerboard() {
    for (let x = 0; x < canvas.width / gridSize; x++) {
        for (let y = 0; y < canvas.height / gridSize; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#a7d397' : '#8bbc8b';
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
    }
}

function drawSnake() {
    // Draw player snake
    drawSingleSnake(snake, '#2ecc71', '#27ae60', direction);
    
    // Draw NPC snakes
    for (let i = 0; i < npcSnakes.length; i++) {
        if (npcSnakes[i].alive) {
            drawSingleSnake(npcSnakes[i].body, npcSnakes[i].color, 
                           npcSnakes[i].color, npcSnakes[i].direction, true);
        }
    }
}

function drawSingleSnake(snakeBody, bodyColor, headColor, snakeDirection, isNPC = false) {
    // Draw body
    for (let i = 1; i < snakeBody.length; i++) {
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(snakeBody[i].x * gridSize + gridSize / 2, snakeBody[i].y * gridSize + gridSize / 2, 
                gridSize / 2 - (isNPC ? 2 : 0), 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw head
    const head = snakeBody[0];
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(head.x * gridSize + gridSize / 2, head.y * gridSize + gridSize / 2, 
            (gridSize / 2 + (isNPC ? 0 : 2)) - (isNPC ? 2 : 0), 0, 2 * Math.PI);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = 'white';
    const eyeRadius = isNPC ? 2 : 3;
    let eyeX1, eyeY1, eyeX2, eyeY2;

    switch (snakeDirection) {
        case 'up':
            eyeX1 = head.x * gridSize + gridSize / 4;
            eyeY1 = head.y * gridSize + gridSize / 4;
            eyeX2 = head.x * gridSize + (gridSize * 3) / 4;
            eyeY2 = head.y * gridSize + gridSize / 4;
            break;
        case 'down':
            eyeX1 = head.x * gridSize + gridSize / 4;
            eyeY1 = head.y * gridSize + (gridSize * 3) / 4;
            eyeX2 = head.x * gridSize + (gridSize * 3) / 4;
            eyeY2 = head.y * gridSize + (gridSize * 3) / 4;
            break;
        case 'left':
            eyeX1 = head.x * gridSize + gridSize / 4;
            eyeY1 = head.y * gridSize + gridSize / 4;
            eyeX2 = head.x * gridSize + gridSize / 4;
            eyeY2 = head.y * gridSize + (gridSize * 3) / 4;
            break;
        case 'right':
            eyeX1 = head.x * gridSize + (gridSize * 3) / 4;
            eyeY1 = head.y * gridSize + gridSize / 4;
            eyeX2 = head.x * gridSize + (gridSize * 3) / 4;
            eyeY2 = head.y * gridSize + (gridSize * 3) / 4;
            break;
    }
    ctx.beginPath();
    ctx.arc(eyeX1, eyeY1, eyeRadius, 0, 2 * Math.PI);
    ctx.arc(eyeX2, eyeY2, eyeRadius, 0, 2 * Math.PI);
    ctx.fill();
}


function drawFood() {
    const appleRadius = gridSize / 2;
    const appleX = food.x * gridSize + appleRadius;
    const appleY = food.y * gridSize + appleRadius;

    // Apple body
    ctx.fillStyle = '#e74c3c'; // Red
    ctx.beginPath();
    ctx.arc(appleX, appleY, appleRadius - 2, 0, 2 * Math.PI);
    ctx.fill();

    // Apple stem
    ctx.fillStyle = '#7f4f24'; // Brown
    ctx.fillRect(appleX - 2, appleY - appleRadius, 4, 5);

    // Apple leaf
    ctx.fillStyle = '#2ecc71'; // Green
    ctx.beginPath();
    ctx.moveTo(appleX, appleY - appleRadius + 2);
    ctx.lineTo(appleX + 5, appleY - appleRadius - 5);
    ctx.lineTo(appleX + 2, appleY - appleRadius);
    ctx.fill();
}


// --- MODIFIED MAIN DRAW FUNCTION ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard();
    drawSnake();
    drawFood();
    scoreDisplay.textContent = 'Score: ' + score;
}

// --- UNCHANGED GAME LOGIC ---

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
    
    // Ensure food doesn't spawn on the player snake
    for (let i = 0; i < snake.length; i++) {
        if (food.x === snake[i].x && food.y === snake[i].y) {
            generateFood();
            return;
        }
    }
    
    // Ensure food doesn't spawn on NPC snakes
    for (let npc of npcSnakes) {
        if (npc.alive) {
            for (let segment of npc.body) {
                if (food.x === segment.x && food.y === segment.y) {
                    generateFood();
                    return;
                }
            }
        }
    }
}

function update() {
    if (gameOver || gamePaused) return;

    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    // Check collision with walls
    if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize) {
        gameOver = true;
        setTimeout(() => alert('Game Over! Your score was: ' + score), 10);
        gamePaused = true;
        startButton.textContent = "Restart";
        return;
    }

    // Check collision with player snake
    if (checkCollision(head)) {
        gameOver = true;
        setTimeout(() => alert('Game Over! Your score was: ' + score), 10);
        gamePaused = true;
        startButton.textContent = "Restart";
        return;
    }

    // Check collision with NPC snakes
    for (let npc of npcSnakes) {
        if (npc.alive) {
            for (let segment of npc.body) {
                if (head.x === segment.x && head.y === segment.y) {
                    gameOver = true;
                    setTimeout(() => alert('Game Over! Your score was: ' + score), 10);
                    gamePaused = true;
                    startButton.textContent = "Restart";
                    return;
                }
            }
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood();
    } else {
        snake.pop();
    }

    // Update NPC snakes
    for (let npc of npcSnakes) {
        if (npc.alive) {
            npc.update();
        }
    }

    draw();
}

function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

function spawnNPCSnakes() {
    npcSnakes = [];
    
    for (let i = 0; i < MAX_NPC_SNAKES; i++) {
        let x, y;
        let validPosition = false;
        
        // Find valid starting position for NPC snake
        while (!validPosition) {
            x = Math.floor(Math.random() * (canvas.width / gridSize));
            y = Math.floor(Math.random() * (canvas.height / gridSize));
            
            // Ensure NPC doesn't spawn on player
            validPosition = true;
            for (let segment of snake) {
                if (x === segment.x && y === segment.y) {
                    validPosition = false;
                    break;
                }
            }
            
            // Ensure NPC doesn't spawn on other NPCs
            if (validPosition) {
                for (let npc of npcSnakes) {
                    for (let segment of npc.body) {
                        if (x === segment.x && y === segment.y) {
                            validPosition = false;
                            break;
                        }
                    }
                    if (!validPosition) break;
                }
            }
        }
        
        npcSnakes.push(new NPCSnake(x, y, NPC_COLORS[i]));
    }
}

function startGame() {
    if (gameOver) {
        snake = [{ x: 10, y: 10 }];
        direction = 'right';
        score = 0;
        gameOver = false;
        generateFood();
        spawnNPCSnakes();
        startButton.textContent = "Start";
    }
    gamePaused = false;
    pauseButton.textContent = "Pause";
    if (!gameInterval) {
        gameInterval = setInterval(update, 120); // Slightly slower for a more relaxed feel
    }
}

function pauseGame() {
    if (gameOver) return;
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? "Resume" : "Pause";
}

document.addEventListener('keydown', e => {
    if (gamePaused && e.key.startsWith('Arrow')) {
        startGame();
    }
    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);

generateFood();
draw();
