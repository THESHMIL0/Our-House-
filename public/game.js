const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let houseItems = []; 
let draggingItem = null; 

// Track the cat's physical position on the screen
let cat = {
    x: 175,
    y: 400,
    targetX: 175,
    targetY: 400
};

// --- SERVER UPDATES ---
socket.on('updateCat', (catData) => {
    catHungerLabel.innerText = catData.hunger;
    // When server picks a new spot, update our target!
    cat.targetX = catData.targetX;
    cat.targetY = catData.targetY;
});

socket.on('updateHouse', (houseData) => {
    houseItems = houseData;
});

feedButton.addEventListener('click', () => {
    socket.emit('feedCat');
});

// --- THE NEW GAME LOOP ---
function gameLoop() {
    // 1. Wipe the screen clean every frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Wallpaper & Floor
    ctx.fillStyle = '#ffedeb'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
    ctx.fillStyle = '#ccebff'; 
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
    ctx.fillStyle = '#8bbbf0'; 
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, 10);

    // 3. Setup Emoji Font
    ctx.font = '70px Arial'; 
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';

    // 4. Draw Furniture
    houseItems.forEach(item => {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + 35, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(item.emoji, item.x, item.y);
    });

    // 5. --- CAT WALKING LOGIC ---
    // Calculate how far the cat is from her target
    let dx = cat.targetX - cat.x;
    let dy = cat.targetY - cat.y;
    
    // Move 2% of the way there every frame (makes it smooth!)
    cat.x += dx * 0.02; 
    cat.y += dy * 0.02;

    // Draw Cat Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cat.x, cat.y + 30, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw the Cat (With flipping magic!)
    ctx.save(); 
    ctx.translate(cat.x, cat.y); 
    
    // If dx is negative, she is walking left, so we mirror the canvas!
    if (dx < 0) {
        ctx.scale(-1, 1); 
    }
    
    ctx.fillText('🐈', 0, 0); 
    ctx.restore(); 

    // 6. Loop forever!
    requestAnimationFrame(gameLoop);
}

// Start the game loop for the first time
gameLoop();

// --- DRAG & DROP LOGIC ---
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = 0; i < houseItems.length; i++) {
        let item = houseItems[i];
        if (Math.abs(mouseX - item.x) < 40 && Math.abs(mouseY - item.y) < 40) {
            draggingItem = item;
            break;
        }
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (draggingItem) {
        const rect = canvas.getBoundingClientRect();
        draggingItem.x = e.clientX - rect.left;
        draggingItem.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('pointerup', (e) => {
    if (draggingItem) {
        socket.emit('moveFurniture', { 
            id: draggingItem.id, 
            x: draggingItem.x, 
            y: draggingItem.y 
        });
        draggingItem = null; 
    }
});
