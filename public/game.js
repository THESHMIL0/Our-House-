const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grab our new menu buttons
const editMenu = document.getElementById('edit-menu');
const btnShrink = document.getElementById('btn-shrink');
const btnGrow = document.getElementById('btn-grow');
const btnDone = document.getElementById('btn-done');

let houseItems = []; 
let draggingItem = null; 
let selectedItem = null; 

let cat = { x: 175, y: 400, targetX: 175, targetY: 400 };

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

// --- NEW BUTTON RESIZING LOGIC ---
function emitUpdate() {
    if (selectedItem) {
        socket.emit('updateFurniture', { 
            id: selectedItem.id, 
            x: selectedItem.x, 
            y: selectedItem.y,
            scale: selectedItem.scale 
        });
    }
}

// When you tap ➕
btnGrow.addEventListener('click', () => {
    if (selectedItem && selectedItem.scale < 3) {
        selectedItem.scale += 0.2; // Grow by 20%
        emitUpdate();
    }
});

// When you tap ➖
btnShrink.addEventListener('click', () => {
    if (selectedItem && selectedItem.scale > 0.5) {
        selectedItem.scale -= 0.2; // Shrink by 20%
        emitUpdate();
    }
});

// When you tap ✅
btnDone.addEventListener('click', () => {
    selectedItem = null;
    editMenu.classList.add('hidden'); // Hide the menu
});

// --- GAME LOOP ---
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

    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- INTERACTION ---
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let clickedSomething = false;

    for (let i = houseItems.length - 1; i >= 0; i--) {
        let item = houseItems[i];
        let size = 70 * (item.scale || 1);
        
        if (Math.abs(mouseX - item.x) < size/1.5 && Math.abs(mouseY - item.y) < size/1.5) {
            draggingItem = item;
            selectedItem = item; 
            clickedSomething = true;
            
            // Pop up the edit menu!
            editMenu.classList.remove('hidden');
            break;
        }
    }

    if (!clickedSomething) {
        selectedItem = null;
        editMenu.classList.add('hidden');
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
        emitUpdate();
        draggingItem = null; 
    }
});
