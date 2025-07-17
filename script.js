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
    // Draw body
    for (let i = 1; i < snake.length; i++) {
        ctx.fillStyle = '#000000'; // Black body
        ctx.beginPath();
        ctx.arc(snake[i].x * gridSize + gridSize / 2, snake[i].y * gridSize + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw head
    const head = snake[0];
    ctx.fillStyle = '#000000'; // Black head
    ctx.beginPath();
    ctx.arc(head.x * gridSize + gridSize / 2, head.y * gridSize + gridSize / 2, gridSize / 2 + 2, 0, 2 * Math.PI); // Slightly larger head
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = 'white';
    const eyeRadius = 3;
    let eyeX1, eyeY1, eyeX2, eyeY2;

    switch (direction) {
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
    // Ensure food doesn't spawn on the snake
    for (let i = 0; i < snake.length; i++) {
        if (food.x === snake[i].x && food.y === snake[i].y) {
            generateFood();
            return;
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

    if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize || checkCollision(head)) {
        gameOver = true;
        // Using a more styled alert later would be better, but for now this is fine.
        setTimeout(() => alert('Game Over! Your score was: ' + score), 10);
        gamePaused = true;
        startButton.textContent = "Restart";
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood();
    } else {
        snake.pop();
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

function startGame() {
    if (gameOver) {
        snake = [{ x: 10, y: 10 }];
        direction = 'right';
        score = 0;
        gameOver = false;
        generateFood();
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
