const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const editMenu = document.getElementById('edit-menu');
const btnShrink = document.getElementById('btn-shrink');
const btnGrow = document.getElementById('btn-grow');
const btnDone = document.getElementById('btn-done');

const storeBtn = document.getElementById('store-btn');
const storeModal = document.getElementById('store-modal');
const closeStoreBtn = document.getElementById('close-store-btn');
const storeItemsHtml = document.querySelectorAll('.store-item');

let houseItems = []; 
let draggingItem = null; 
let selectedItem = null; 
let cat = { x: 175, y: 400, targetX: 175, targetY: 400 };

// --- NEW CAMERA SETTINGS ---
const ROOM_WIDTH = 1400; // 4x the width of your screen!
let cameraX = 0; // Where the camera is currently looking
let isPanning = false; 
let panStartX = 0;
let cameraStartX = 0;

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

// --- STORE LOGIC ---
storeBtn.addEventListener('click', () => {
    storeModal.classList.remove('hidden');
});

closeStoreBtn.addEventListener('click', () => {
    storeModal.classList.add('hidden');
});

storeItemsHtml.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const emoji = e.target.innerText;
        
        const newItem = {
            id: 'item_' + Date.now(), 
            emoji: emoji,
            // Drop it exactly in the middle of where the camera is currently looking!
            x: cameraX + (canvas.width / 2), 
            y: 350,
            scale: 1
        };
        
        socket.emit('addFurniture', newItem);
        storeModal.classList.add('hidden');
    });
});

// --- BUTTON RESIZING LOGIC ---
function emitUpdate() {
    if (selectedItem) {
        socket.emit('updateFurniture', { 
            id: selectedItem.id, x: selectedItem.x, y: selectedItem.y, scale: selectedItem.scale 
        });
    }
}

btnGrow.addEventListener('click', () => {
    if (selectedItem && selectedItem.scale < 3) { selectedItem.scale += 0.2; emitUpdate(); }
});

btnShrink.addEventListener('click', () => {
    if (selectedItem && selectedItem.scale > 0.5) { selectedItem.scale -= 0.2; emitUpdate(); }
});

btnDone.addEventListener('click', () => {
    selectedItem = null;
    editMenu.classList.add('hidden'); 
});

// --- GAME LOOP ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Turn on the virtual camera!
    ctx.save();
    ctx.translate(-cameraX, 0); 

    // Draw Wallpaper, Floor, and Baseboard out to the new ROOM_WIDTH!
    ctx.fillStyle = '#ffedeb'; 
    ctx.fillRect(0, 0, ROOM_WIDTH, canvas.height * 0.6);
    ctx.fillStyle = '#ccebff'; 
    ctx.fillRect(0, canvas.height * 0.6, ROOM_WIDTH, canvas.height * 0.4);
    ctx.fillStyle = '#8bbbf0'; 
    ctx.fillRect(0, canvas.height * 0.6, ROOM_WIDTH, 10);

    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';

    houseItems.forEach(item => {
        let scale = item.scale || 1;
        let size = 70 * scale; 
        ctx.font = size + 'px Arial'; 

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + (size/2), size/2, size/6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black'; 
        ctx.fillText(item.emoji, item.x, item.y);

        if (selectedItem && selectedItem.id === item.id) {
            ctx.strokeStyle = '#ff7043';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(item.x, item.y, size/1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); 
        }
    });

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
    ctx.fillStyle = 'black'; 
    ctx.fillText('🐈', 0, 0); 
    ctx.restore(); 

    // Turn off the virtual camera so the UI stays in place
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- INTERACTION (WITH CAMERA LOGIC) ---
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Add the camera position to our finger position to find the item!
    const mouseX = e.clientX - rect.left + cameraX; 
    const mouseY = e.clientY - rect.top;
    
    let clickedSomething = false;

    for (let i = houseItems.length - 1; i >= 0; i--) {
        let item = houseItems[i];
        let size = 70 * (item.scale || 1);
        
        if (Math.abs(mouseX - item.x) < size/1.5 && Math.abs(mouseY - item.y) < size/1.5) {
            draggingItem = item;
            selectedItem = item; 
            clickedSomething = true;
            editMenu.classList.remove('hidden');
            break;
        }
    }

    // If we didn't click furniture, we must want to pan the camera!
    if (!clickedSomething) {
        selectedItem = null;
        editMenu.classList.add('hidden');
        isPanning = true;
        panStartX = e.clientX;
        cameraStartX = cameraX;
    }
});

canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    
    // If holding furniture, move the furniture
    if (draggingItem) {
        draggingItem.x = e.clientX - rect.left + cameraX;
        draggingItem.y = e.clientY - rect.top;
    } 
    // If holding the floor, pan the camera!
    else if (isPanning) {
        cameraX = cameraStartX - (e.clientX - panStartX);
        
        // Stop the camera from going past the walls
        if (cameraX < 0) cameraX = 0;
        if (cameraX > ROOM_WIDTH - canvas.width) cameraX = ROOM_WIDTH - canvas.width;
    }
});

canvas.addEventListener('pointerup', (e) => {
    if (draggingItem) {
        emitUpdate();
        draggingItem = null; 
    }
    isPanning = false; // Stop panning when you let go
});
