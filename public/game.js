const socket = io();
const catHungerLabel = document.getElementById('cat-hunger');
const feedButton = document.getElementById('feed-btn');
const room = document.getElementById('room');

// --- CAT LOGIC ---
socket.on('updateCat', (catData) => {
    catHungerLabel.innerText = catData.hunger;
});

feedButton.addEventListener('click', () => {
    socket.emit('feedCat');
});

// --- HOUSE & FURNITURE LOGIC ---
socket.on('updateHouse', (houseData) => {
    houseData.forEach(item => {
        let el = document.getElementById(item.id);
        
        if (!el) {
            el = document.createElement('div');
            el.className = 'furniture';
            el.id = item.id;
            el.innerText = item.emoji;
            room.appendChild(el);

            let isDragging = false;

            el.addEventListener('pointerdown', (e) => {
                isDragging = true;
                el.setPointerCapture(e.pointerId);
            });

            el.addEventListener('pointermove', (e) => {
                if (isDragging) {
                    const roomRect = room.getBoundingClientRect();
                    let newX = e.clientX - roomRect.left - 20; 
                    let newY = e.clientY - roomRect.top - 20;
                    el.style.left = newX + 'px';
                    el.style.top = newY + 'px';
                }
            });

            el.addEventListener('pointerup', (e) => {
                if (isDragging) {
                    isDragging = false;
                    el.releasePointerCapture(e.pointerId);
                    
                    const roomRect = room.getBoundingClientRect();
                    let finalX = e.clientX - roomRect.left - 20;
                    let finalY = e.clientY - roomRect.top - 20;
                    
                    socket.emit('moveFurniture', { id: item.id, x: finalX, y: finalY });
                }
            });
        }
        
        el.style.left = item.x + 'px';
        el.style.top = item.y + 'px';
    });
});
