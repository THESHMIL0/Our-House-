const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Cat state now includes target coordinates for walking!
let catData = {
    name: "Luna",
    hunger: 50,
    happiness: 100,
    targetX: 175,
    targetY: 400
};

// Initial furniture positions
let houseData = [
    { id: 'bed', emoji: '🛏️', x: 100, y: 350 },
    { id: 'sofa', emoji: '🛋️', x: 250, y: 350 },
    { id: 'plant', emoji: '🪴', x: 50, y: 450 }
];

io.on('connection', (socket) => {
    console.log('A player connected!');

    socket.emit('updateCat', catData);
    socket.emit('updateHouse', houseData);

    socket.on('feedCat', () => {
        if (catData.hunger < 100) {
            catData.hunger += 10;
            io.emit('updateCat', catData);
        }
    });

    socket.on('moveFurniture', (data) => {
        let item = houseData.find(f => f.id === data.id);
        if (item) {
            item.x = data.x;
            item.y = data.y;
            io.emit('updateHouse', houseData);
        }
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected.');
    });
});

// --- THE CAT'S BRAIN ---
// Every 4 seconds, the server picks a new random spot for the cat to walk to
setInterval(() => {
    // Pick a random X and Y inside the blue floor area
    catData.targetX = 50 + Math.random() * 250; 
    catData.targetY = 320 + Math.random() * 150; 
    
    // Tell all players where the cat is going!
    io.emit('updateCat', catData);
}, 4000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
});
