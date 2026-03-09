// --- THE GAME LOOP ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Turn on Camera
    ctx.save();
    ctx.translate(-cameraX, 0); 

    // 1. Draw the wide wallpaper and floor
    ctx.fillStyle = '#ffedeb'; 
    ctx.fillRect(0, 0, ROOM_WIDTH, canvas.height * 0.6);
    ctx.fillStyle = '#ccebff'; 
    ctx.fillRect(0, canvas.height * 0.6, ROOM_WIDTH, canvas.height * 0.4);
    ctx.fillStyle = '#8bbbf0'; 
    ctx.fillRect(0, canvas.height * 0.6, ROOM_WIDTH, 10);

    // 2. NEW: Draw the Dividing Walls! 🧱
    ctx.fillStyle = '#8d6e63'; // Dark wood pillar color
    
    // Wall 1: Separates Room 1 and Room 2 (at 466 pixels)
    ctx.fillRect(466, 0, 15, canvas.height); 
    // Wall 2: Separates Room 2 and Room 3 (at 933 pixels)
    ctx.fillRect(933, 0, 15, canvas.height);

    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';

    // ... (Keep all the rest of your gameLoop code exactly the same below this!)
