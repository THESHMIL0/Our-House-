const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Shared game state
let catData = {
    name: "Luna",
    hunger: 50,
    happiness: 100
};

// Shared house state (our furniture and where it is)
let houseData = [
    { id: 'bed', emoji: '🛏️', x: 20, y: 20 },
    { id: 'sofa', emoji: '🛋️', x: 150, y: 20 },
    { id: 'plant', emoji: '🪴', x: 20, y: 150 }
];

io.on('connection', (socket) => {
    console.log('A player connected!');

    // Send the current cat and house data to the new player
    socket.emit('updateCat', catData);
    socket.emit('updateHouse', houseData);

    // When a player clicks the "feed" button
    socket.on('feedCat', () => {
        if (catData.hunger < 100) {
            catData.hunger += 10;
            io.emit('updateCat', catData);
        }
    });

    // When a player drags and drops furniture
    socket.on('moveFurniture', (data) => {
        // Find the specific piece of furniture they moved
        let item = houseData.find(f => f.id === data.id);
        if (item) {
            // Update its position
            item.x = data.x;
            item.y = data.y;
            // Tell everyone playing about the new position!
            io.emit('updateHouse', houseData);
        }
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
});
