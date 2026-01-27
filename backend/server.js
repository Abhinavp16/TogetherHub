const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/togetherhub';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/rooms', require('./routes/rooms'));

// Socket.io Logic
const roomUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, user }) => {
        socket.join(roomId);

        if (!roomUsers.has(roomId)) {
            roomUsers.set(roomId, new Set());
        }

        const userData = { ...user, socketId: socket.id };
        roomUsers.get(roomId).add(JSON.stringify(userData));

        // Send current users in room to the new user
        const usersInRoom = Array.from(roomUsers.get(roomId)).map(u => JSON.parse(u));
        io.to(roomId).emit('users-update', usersInRoom);

        console.log(`User ${user.name} joined room: ${roomId}`);
    });

    socket.on('send-update', ({ roomId, content, type }) => {
        socket.to(roomId).emit('receive-update', { content, type });
    });

    socket.on('cursor-move', ({ roomId, userId, userName, cursor }) => {
        socket.to(roomId).emit('cursor-receive-move', {
            userId,
            userName,
            cursor
        });
    });

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomUsers.has(roomId)) {
                const users = roomUsers.get(roomId);
                for (const u of users) {
                    const userData = JSON.parse(u);
                    if (userData.socketId === socket.id) {
                        users.delete(u);
                        break;
                    }
                }
                const updatedUsers = Array.from(roomUsers.get(roomId)).map(u => JSON.parse(u));
                io.to(roomId).emit('users-update', updatedUsers);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Together Hub API is running' });
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
