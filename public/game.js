const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');

// --- SET UP THE CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let houseItems = []; // This will store the data from the server
let draggingItem = null; // Keeps track of what we are currently dragging

// --- CAT LOGIC ---
socket.on('updateCat', (catData) => {
    catHungerLabel.innerText = catData.hunger;
});

feedButton.addEventListener('click', () => {
    socket.emit('feedCat');
});

// --- DRAWING THE GAME USING CODE ---
function drawGame() {
    // 1. Clear the old frame (wipe the sketchpad clean)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Loop through all the furniture the server sent us
    houseItems.forEach(item => {
        
        if (item.id === 'bed') {
            // Draw a Bed (Blue mattress + White pillow)
            ctx.fillStyle = '#42a5f5'; // Blue color
            ctx.fillRect(item.x, item.y, 50, 70); // Mattress
            ctx.fillStyle = '#ffffff'; // White color
            ctx.fillRect(item.x + 5, item.y + 5, 40, 20); // Pillow
            
        } else if (item.id === 'sofa') {
            // Draw a Sofa (Dark red back + bright red seat)
            ctx.fillStyle = '#b71c1c'; // Dark red
            ctx.fillRect(item.x, item.y, 80, 40); // Backrest
            ctx.fillStyle = '#f44336'; // Bright red
            ctx.fillRect(item.x, item.y + 15, 80, 25); // Seat
            
        } else if (item.id === 'plant') {
            // Draw a Plant (Brown pot + Green leaves)
            ctx.fillStyle = '#795548'; // Brown pot
            ctx.fillRect(item.x + 15, item.y + 25, 20, 25);
            ctx.fillStyle = '#4caf50'; // Green leaves (drawn as a circle!)
            ctx.beginPath();
            ctx.arc(item.x + 25, item.y + 15, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Listen for server updates and redraw the game
socket.on('updateHouse', (houseData) => {
    houseItems = houseData;
    drawGame(); // Redraw whenever the server sends new positions!
});

// --- NEW CANVAS DRAG & DROP MAGIC ---

canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if we clicked on any furniture (Assuming a roughly 50x50 hit area)
    for (let i = 0; i < houseItems.length; i++) {
        let item = houseItems[i];
        if (mouseX >= item.x && mouseX <= item.x + 60 &&
            mouseY >= item.y && mouseY <= item.y + 60) {
            draggingItem = item;
            break;
        }
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (draggingItem) {
        const rect = canvas.getBoundingClientRect();
        // Update item position to follow your finger/mouse
        draggingItem.x = e.clientX - rect.left - 25; // -25 centers it on your finger
        draggingItem.y = e.clientY - rect.top - 25;
        drawGame(); // Redraw the game instantly so it follows you
    }
});

canvas.addEventListener('pointerup', (e) => {
    if (draggingItem) {
        // Tell the server where we finally dropped it!
        socket.emit('moveFurniture', { 
            id: draggingItem.id, 
            x: draggingItem.x, 
            y: draggingItem.y 
        });
        draggingItem = null; // Stop dragging
    }
});
