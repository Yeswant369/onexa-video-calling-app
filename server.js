const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA routing - all /room/* requests serve index.html
app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Room occupancy tracking
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        const usersInRoom = rooms[roomId] || [];
        const numUsers = usersInRoom.length;

        if (numUsers >= 3) {
            socket.emit('room-full');
            return;
        }

        rooms[roomId] = [...usersInRoom, socket.id];
        socket.join(roomId);

        console.log(`User ${socket.id} joined room ${roomId}. Total users: ${rooms[roomId].length}`);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', socket.id);

        // Send existing users to the new user so they can initiate connections
        socket.emit('all-users', usersInRoom);
    });

    // Signaling: Offer
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', {
            offer: payload.offer,
            sender: socket.id
        });
    });

    // Signaling: Answer
    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', {
            answer: payload.answer,
            sender: socket.id
        });
    });

    // Signaling: ICE Candidate
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', {
            candidate: payload.candidate,
            sender: socket.id
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Cleanup rooms
        for (const roomId in rooms) {
            if (rooms[roomId].includes(socket.id)) {
                rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
                if (rooms[roomId].length === 0) {
                    delete rooms[roomId];
                } else {
                    socket.to(roomId).emit('user-left', socket.id);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
