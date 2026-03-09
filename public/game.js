// --- 1. MOBILE MAGIC DEBUGGER ---
// If the game crashes, paint the error on the screen so we can see it!
window.onerror = function(msg, url, line, col, error) {
    const errorCanvas = document.getElementById('gameCanvas');
    if (errorCanvas) {
        const errorCtx = errorCanvas.getContext('2d');
        errorCtx.fillStyle = 'white';
        errorCtx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
        errorCtx.fillStyle = 'red';
        errorCtx.font = '16px Arial';
        errorCtx.textAlign = 'left';
        errorCtx.fillText("Crash! " + msg, 10, 50);
        errorCtx.fillText("Line: " + line, 10, 80);
    }
    return false;
};

// --- 2. GAME SETUP ---
const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grab UI elements safely
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
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

// --- 3. VIRTUAL CAMERA SETTINGS ---
const ROOM_WIDTH = 1400; // 4x the width!
let cameraX = 0; 
let isPanning = false; 
let panStartX = 0;
let cameraStartX = 0;

// --- 4. SERVER COMMUNICATION ---
socket.on('updateCat', (catData) => {
    // Safety check: Only update text if the label actually exists
    if (catHungerLabel) catHungerLabel.innerText = catData.hunger;
    cat.targetX = catData.targetX;
    cat.targetY = catData.targetY;
});

socket.on('updateHouse', (houseData) => {
    houseItems = houseData;
});

if (feedButton) {
    feedButton.addEventListener('click', () => socket.emit('feedCat'));
}

// --- 5. STORE UI LOGIC ---
if (storeBtn && storeModal) {
    storeBtn.addEventListener('click', () => storeModal.classList.remove('hidden'));
    closeStoreBtn.addEventListener('click', () => storeModal.classList.add('hidden'));

    storeItemsHtml.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const emoji = e.target.innerText;
            const newItem = {
                id: 'item_' + Date.now(), 
                emoji: emoji,
                x: cameraX + (canvas.width / 2), // Drop in center of camera!
                y: 350,
                scale: 1
            };
            socket.emit('addFurniture', newItem);
            storeModal.classList.add('hidden');
        });
    });
}

// --- 6. RESIZING LOGIC ---
function emitUpdate() {
    if (selectedItem) {
        socket.emit('updateFurniture', { 
            id: selectedItem.id, x: selectedItem.x, y: selectedItem.y, scale: selectedItem.scale 
        });
    }
}

if (btnGrow) {
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
}

// --- 7. THE GAME LOOP ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Turn on Camera
    ctx.save();
    ctx.translate(-cameraX, 0); 

    // Draw wide room
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

    // Turn off Camera
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- 8. CAMERA & TOUCH CONTROLS ---
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
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
            if (editMenu) editMenu.classList.remove('hidden');
            break;
        }
    }

    if (!clickedSomething) {
        selectedItem = null;
        if (editMenu) editMenu.classList.add('hidden');
        isPanning = true;
        panStartX = e.clientX;
        cameraStartX = cameraX;
    }
});

canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    
    if (draggingItem) {
        draggingItem.x = e.clientX - rect.left + cameraX;
        draggingItem.y = e.clientY - rect.top;
    } 
    else if (isPanning) {
        cameraX = cameraStartX - (e.clientX - panStartX);
        if (cameraX < 0) cameraX = 0;
        if (cameraX > ROOM_WIDTH - canvas.width) cameraX = ROOM_WIDTH - canvas.width;
    }
});

canvas.addEventListener('pointerup', (e) => {
    if (draggingItem) { emitUpdate(); draggingItem = null; }
    isPanning = false; 
});
