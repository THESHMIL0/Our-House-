const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let houseItems = []; 
let draggingItem = null; 

// --- CAT LOGIC ---
socket.on('updateCat', (catData) => {
    catHungerLabel.innerText = catData.hunger;
});

feedButton.addEventListener('click', () => {
    socket.emit('feedCat');
});

// --- DRAWING THE NEW 2.5D GAME ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw the Wall (Top 60% of the screen)
    ctx.fillStyle = '#ffedeb'; // Light pink wallpaper
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

    // 2. Draw the Floor (Bottom 40% of the screen)
    ctx.fillStyle = '#ccebff'; // Light blue floor (like your screenshot!)
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

    // 3. Draw the Baseboard (Line between wall and floor)
    ctx.fillStyle = '#8bbbf0'; // Darker blue line
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, 10);

    // 4. Draw the Furniture!
    ctx.font = '70px Arial'; // Draw huge emojis
    ctx.textAlign = 'center'; // Center the item on our finger
    ctx.textBaseline = 'middle';

    houseItems.forEach(item => {
        // Draw a shadow under the item to make it look 3D
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + 35, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw the item itself (Using the emoji from our server!)
        ctx.fillText(item.emoji, item.x, item.y);
    });
}

socket.on('updateHouse', (houseData) => {
    houseItems = houseData;
    drawGame(); 
});

// --- DRAG & DROP LOGIC ---
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if we clicked near the center of an emoji
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
        drawGame(); 
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
