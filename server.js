const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let catData = {
    name: "Luna",
    hunger: 50,
    happiness: 100,
    targetX: 175,
    targetY: 400
};

let houseData = [
    { id: 'bed', emoji: '🛏️', x: 100, y: 350, scale: 1 },
    { id: 'sofa', emoji: '🛋️', x: 250, y: 350, scale: 1 },
    { id: 'plant', emoji: '🪴', x: 50, y: 450, scale: 1 }
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

    socket.on('updateFurniture', (data) => {
        let item = houseData.find(f => f.id === data.id);
        if (item) {
            item.x = data.x;
            item.y = data.y;
            item.scale = data.scale; 
            io.emit('updateHouse', houseData); 
        }
    });

    socket.on('addFurniture', (newItem) => {
        houseData.push(newItem);
        io.emit('updateHouse', houseData); 
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected.');
    });
});

// THE CAT'S NEW BOUNDARIES (Now 1400px wide!)
setInterval(() => {
    catData.targetX = 50 + Math.random() * 1300; 
    catData.targetY = 320 + Math.random() * 150; 
    io.emit('updateCat', catData);
}, 4000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
});
