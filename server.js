const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the frontend files from the "public" folder
app.use(express.static('public'));

// This is our shared game state
let catData = {
    name: "Luna",
    hunger: 50,
    happiness: 100
};

// When a player connects to the game
io.on('connection', (socket) => {
    console.log('A player connected!');

    // Instantly send them the current cat data
    socket.emit('updateCat', catData);

    // When this player clicks the "feed" button
    socket.on('feedCat', () => {
        if (catData.hunger < 100) {
            catData.hunger += 10; // Increase hunger bar
            console.log('The cat was fed!');
            
            // Broadcast the new cat data to EVERYONE playing
            io.emit('updateCat', catData);
        }
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected.');
    });
});

// Start the server on port 3000 (or the port Render assigns us)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game server running on http://localhost:${PORT}`);
});
