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

// --- ANIMATION VARIABLES ---
let floatingAnimations = [];
let animationTime = 0;

// --- UTILITY FUNCTIONS ---
function shadeColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// --- NEW DRAWING FUNCTIONS ---

function initAnimations() {
    // Create floating hearts and stars
    for (let i = 0; i < 8; i++) {
        floatingAnimations.push({
            type: Math.random() > 0.5 ? 'heart' : 'star',
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 15 + 10,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function drawCheckerboard() {
    for (let x = 0; x < canvas.width / gridSize; x++) {
        for (let y = 0; y < canvas.height / gridSize; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#a7d397' : '#8bbc8b';
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
    }
}

function drawFloatingAnimations() {
    animationTime += 0.02;
    
    floatingAnimations.forEach(anim => {
        const yOffset = Math.sin(animationTime + anim.phase) * 20;
        const xOffset = Math.cos(animationTime * 0.5 + anim.phase) * 10;
        
        ctx.save();
        ctx.globalAlpha = anim.opacity * (0.5 + Math.sin(animationTime * 2 + anim.phase) * 0.5);
        
        if (anim.type === 'heart') {
            drawHeart(anim.x + xOffset, anim.y + yOffset, anim.size);
        } else {
            drawStar(anim.x + xOffset, anim.y + yOffset, anim.size);
        }
        
        ctx.restore();
        
        // Reset position when out of bounds
        if (anim.y + yOffset < -50) {
            anim.y = canvas.height + 50;
            anim.x = Math.random() * canvas.width;
        }
        anim.y -= anim.speed;
    });
}

function drawHeart(x, y, size) {
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    ctx.fill();
}

function drawStar(x, y, size) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        
        if (i === 0) {
            ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        } else {
            ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        }
        ctx.lineTo(x + Math.cos(innerAngle) * size * 0.5, y + Math.sin(innerAngle) * size * 0.5);
    }
    ctx.closePath();
    ctx.fill();
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
    // Draw body with cute rounded segments
    for (let i = 1; i < snakeBody.length; i++) {
        const segment = snakeBody[i];
        const x = segment.x * gridSize + gridSize / 2;
        const y = segment.y * gridSize + gridSize / 2;
        
        // Add subtle pulsing to body segments
        const pulse = Math.sin(animationTime * 3 + i * 0.5) * 0.05 + 1;
        const radius = (gridSize / 2 - (isNPC ? 2 : 0)) * pulse;
        
        // Gradient for 3D effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, bodyColor);
        gradient.addColorStop(1, shadeColor(bodyColor, -20));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Cute cheek circles for player snake
        if (!isNPC && i % 3 === 1) {
            ctx.fillStyle = 'rgba(255, 192, 203, 0.3)';
            ctx.beginPath();
            ctx.arc(x + 3, y + 3, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Draw head with expression
    const head = snakeBody[0];
    const headX = head.x * gridSize + gridSize / 2;
    const headY = head.y * gridSize + gridSize / 2;
    
    // Head pulsing
    const headPulse = Math.sin(animationTime * 4) * 0.1 + 1;
    const headRadius = ((gridSize / 2 + (isNPC ? 0 : 2)) - (isNPC ? 2 : 0)) * headPulse;
    
    // Head gradient
    const headGradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, headRadius);
    headGradient.addColorStop(0, headColor);
    headGradient.addColorStop(1, shadeColor(headColor, -20));
    
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw eyes with blinking
    const blinkCycle = Math.sin(animationTime * 2);
    const isBlinking = blinkCycle > 0.9;
    const eyeScale = isBlinking ? 0.1 : 1;
    
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
    
    // Draw eye whites
    ctx.beginPath();
    ctx.ellipse(eyeX1, eyeY1, eyeRadius, eyeRadius * eyeScale, 0, 0, 2 * Math.PI);
    ctx.ellipse(eyeX2, eyeY2, eyeRadius, eyeRadius * eyeScale, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw pupils
    if (!isBlinking) {
        ctx.fillStyle = 'black';
        const pupilRadius = eyeRadius * 0.6;
        const pupilOffsetX = Math.sin(animationTime * 0.5) * 0.5;
        const pupilOffsetY = Math.cos(animationTime * 0.5) * 0.5;
        
        ctx.beginPath();
        ctx.arc(eyeX1 + pupilOffsetX, eyeY1 + pupilOffsetY, pupilRadius, 0, 2 * Math.PI);
        ctx.arc(eyeX2 + pupilOffsetX, eyeY2 + pupilOffsetY, pupilRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Eye shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(eyeX1 - 1, eyeY1 - 1, 1, 0, 2 * Math.PI);
        ctx.arc(eyeX2 - 1, eyeY2 - 1, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Cute mouth for player snake
    if (!isNPC) {
        const mouthY = headY + 3;
        const mouthCurve = Math.sin(animationTime * 3) * 0.5 + 1; // Smiling animation
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(headX, mouthY, 4, 0, Math.PI * mouthCurve);
        ctx.stroke();
    }
}


function drawFood() {
    const appleRadius = gridSize / 2;
    const appleX = food.x * gridSize + appleRadius;
    const appleY = food.y * gridSize + appleRadius;
    
    // Animation effects
    const pulse = Math.sin(animationTime * 4) * 0.1 + 1;
    const rotation = animationTime * 2;

    ctx.save();
    ctx.translate(appleX, appleY);
    ctx.rotate(rotation);
    ctx.scale(pulse, pulse);

    // Apple body with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, appleRadius);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#e74c3c');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, appleRadius - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sparkle effect
    const sparkleOpacity = Math.abs(Math.sin(animationTime * 6)) * 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkleOpacity})`;
    ctx.beginPath();
    ctx.arc(-appleRadius * 0.3, -appleRadius * 0.3, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();

    // Apple stem
    ctx.save();
    ctx.translate(appleX, appleY);
    ctx.rotate(rotation);
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(-2, -appleRadius - 2, 4, 6);

    // Apple leaf with wiggle
    const leafWiggle = Math.sin(animationTime * 3) * 0.2;
    ctx.save();
    ctx.translate(0, -appleRadius - 2);
    ctx.rotate(leafWiggle);
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -8);
    ctx.lineTo(3, 0);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
}


// --- MODIFIED MAIN DRAW FUNCTION ---

function drawGameStatus() {
    if (gameOver) {
        // Game Over animation
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Game Over text with bounce effect
        const bounce = Math.abs(Math.sin(animationTime * 4)) * 5;
        ctx.fillStyle = '#ff6b6b';
        ctx.font = `bold ${40 + bounce}px Nunito`;
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
        
        // Score with sparkle
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Nunito';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
        
        // Restart hint
        ctx.fillStyle = '#fff';
        ctx.font = '18px Nunito';
        ctx.fillText('Click Start to play again!', canvas.width / 2, canvas.height / 2 + 40);
        
        ctx.restore();
    } else if (gamePaused && !gameOver) {
        // Pause screen
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Pause text with floating effect
        const float = Math.sin(animationTime * 2) * 10;
        ctx.fillStyle = '#87CEEB';
        ctx.font = `bold ${35 + float}px Nunito`;
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '18px Nunito';
        ctx.fillText('Press Resume to continue', canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.restore();
    } else if (gamePaused && score === 0) {
        // Start screen
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Welcome text with rainbow effect
        const hue = (animationTime * 50) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.font = 'bold 32px Nunito';
        ctx.textAlign = 'center';
        ctx.fillText('Welcome to Snake Game!', canvas.width / 2, canvas.height / 2 - 40);
        
        // Instructions
        ctx.fillStyle = '#fff';
        ctx.font = '16px Nunito';
        ctx.fillText('Use arrow keys to move', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Eat apples to grow and score points!', canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillText('Watch out for other snakes!', canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.restore();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard();
    drawFloatingAnimations();
    drawSnake();
    drawFood();
    drawGameStatus();
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
initAnimations();
draw();
