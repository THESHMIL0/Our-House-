const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const editTools = document.getElementById('edit-tools');
const sizeSlider = document.getElementById('size-slider');

let houseItems = []; 
let draggingItem = null; 
let selectedItem = null; // Keeps track of what item we clicked to resize

let cat = { x: 175, y: 400, targetX: 175, targetY: 400 };

// --- SERVER UPDATES ---
socket.on('updateCat', (catData) => {
    catHungerLabel.innerText = catData.hunger;
    cat.targetX = catData.targetX;
    cat.targetY = catData.targetY;
});

socket.on('updateHouse', (houseData) => {
    houseItems = houseData;
});

feedButton.addEventListener('click', () => {
    socket.emit('feedCat');
});

// --- SLIDER LOGIC ---
// When we move the slider, resize the selected item instantly!
sizeSlider.addEventListener('input', (e) => {
    if (selectedItem) {
        selectedItem.scale = parseFloat(e.target.value);
        // Tell the server the new size
        socket.emit('updateFurniture', { 
            id: selectedItem.id, 
            x: selectedItem.x, 
            y: selectedItem.y,
            scale: selectedItem.scale 
        });
    }
});

// --- THE GAME LOOP ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffedeb'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
    ctx.fillStyle = '#ccebff'; 
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
    ctx.fillStyle = '#8bbbf0'; 
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, 10);

    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';

    // 1. Draw Furniture
    houseItems.forEach(item => {
        let scale = item.scale || 1;
        let size = 70 * scale; // Adjust size based on scale!
        ctx.font = size + 'px Arial'; 

        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + (size/2), size/2, size/6, 0, 0, Math.PI * 2);
        ctx.fill();

        // FIX THE BUG: Switch back to solid color before drawing the emoji!
        ctx.fillStyle = 'black'; 
        ctx.fillText(item.emoji, item.x, item.y);

        // If this item is selected, draw a dashed ring around it!
        if (selectedItem && selectedItem.id === item.id) {
            ctx.strokeStyle = '#ff7043';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(item.x, item.y, size/1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dashed lines
        }
    });

    // 2. Draw Cat
    let dx = cat.targetX - cat.x;
    let dy = cat.targetY - cat.y;
    cat.x += dx * 0.02; 
    cat.y += dy * 0.02;

    ctx.font = '70px Arial'; 
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cat.x, cat.y + 30, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save(); 
    ctx.translate(cat.x, cat.y); 
    if (dx < 0) ctx.scale(-1, 1); 
    
    // FIX THE BUG for the cat too!
    ctx.fillStyle = 'black'; 
    ctx.fillText('🐈', 0, 0); 
    ctx.restore(); 

    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- INTERACTION LOGIC ---
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let clickedSomething = false;

    // Check if we tapped a piece of furniture
    for (let i = houseItems.length - 1; i >= 0; i--) {
        let item = houseItems[i];
        let size = 70 * (item.scale || 1);
        
        if (Math.abs(mouseX - item.x) < size/1.5 && Math.abs(mouseY - item.y) < size/1.5) {
            draggingItem = item;
            selectedItem = item; // Mark as selected
            clickedSomething = true;
            
            // Show the edit tools and set the slider to the item's current size!
            editTools.style.visibility = 'visible';
            sizeSlider.value = item.scale || 1;
            break;
        }
    }

    // If we clicked the empty floor, hide the edit tools
    if (!clickedSomething) {
        selectedItem = null;
        editTools.style.visibility = 'hidden';
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
        socket.emit('updateFurniture', { 
            id: draggingItem.id, 
            x: draggingItem.x, 
            y: draggingItem.y,
            scale: draggingItem.scale || 1
        });
        draggingItem = null; 
    }
});
