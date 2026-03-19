const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000"
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
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
const meetingRooms = new Map();
const meetingSocketRoom = new Map();
const meetingSocketUser = new Map();
const meetingMicStatus = new Map();
const meetingVideoStatus = new Map();

const getMeetingUsers = (roomId) => {
    if (!meetingRooms.has(roomId)) {
        return [];
    }

    return Array.from(meetingRooms.get(roomId)).map((socketId) => {
        const user = meetingSocketUser.get(socketId) || {};
        return {
            socketId,
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            micStatus: meetingMicStatus.get(socketId) || 'on',
            videoStatus: meetingVideoStatus.get(socketId) || 'on'
        };
    });
};

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

    socket.on('meeting-join-room', ({ roomId, user }) => {
        socket.join(roomId);
        meetingSocketRoom.set(socket.id, roomId);
        meetingSocketUser.set(socket.id, user);
        meetingMicStatus.set(socket.id, 'on');
        meetingVideoStatus.set(socket.id, 'on');

        if (!meetingRooms.has(roomId)) {
            meetingRooms.set(roomId, new Set());
        }

        const existingPeers = Array.from(meetingRooms.get(roomId));
        meetingRooms.get(roomId).add(socket.id);

        const peerDetails = existingPeers.reduce((acc, peerId) => {
            const peerUser = meetingSocketUser.get(peerId) || {};
            acc[peerId] = {
                id: peerUser.id,
                name: peerUser.name,
                avatar: peerUser.avatar,
                micStatus: meetingMicStatus.get(peerId) || 'on',
                videoStatus: meetingVideoStatus.get(peerId) || 'on'
            };
            return acc;
        }, {});

        socket.emit('meeting-room-joined', {
            peers: existingPeers,
            peerDetails,
            selfId: socket.id
        });

        io.to(roomId).emit('meeting-users-update', getMeetingUsers(roomId));
    });

    socket.on('meeting-offer', ({ offer, targetPeerId }) => {
        const user = meetingSocketUser.get(socket.id) || {};

        socket.to(targetPeerId).emit('meeting-offer', {
            offer,
            fromPeerId: socket.id,
            user: {
                id: user.id,
                name: user.name,
                avatar: user.avatar
            },
            micStatus: meetingMicStatus.get(socket.id) || 'on',
            videoStatus: meetingVideoStatus.get(socket.id) || 'on'
        });
    });

    socket.on('meeting-answer', ({ answer, targetPeerId }) => {
        socket.to(targetPeerId).emit('meeting-answer', {
            answer,
            fromPeerId: socket.id
        });
    });

    socket.on('meeting-ice-candidate', ({ candidate, targetPeerId }) => {
        socket.to(targetPeerId).emit('meeting-ice-candidate', {
            candidate,
            fromPeerId: socket.id
        });
    });

    socket.on('meeting-action', ({ action }) => {
        if (action === 'mute') {
            meetingMicStatus.set(socket.id, 'off');
        } else if (action === 'unmute') {
            meetingMicStatus.set(socket.id, 'on');
        } else if (action === 'videooff') {
            meetingVideoStatus.set(socket.id, 'off');
        } else if (action === 'videoon') {
            meetingVideoStatus.set(socket.id, 'on');
        }

        const roomId = meetingSocketRoom.get(socket.id);
        if (!roomId) return;

        socket.to(roomId).emit('meeting-action', {
            action,
            peerId: socket.id
        });
        io.to(roomId).emit('meeting-users-update', getMeetingUsers(roomId));
    });

    socket.on('meeting-chat-message', ({ roomId, message, sender }) => {
        io.to(roomId).emit('meeting-chat-message', {
            id: `${socket.id}-${Date.now()}`,
            message,
            sender,
            timestamp: new Date().toISOString()
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
        const meetingRoomId = meetingSocketRoom.get(socket.id);

        if (meetingRoomId && meetingRooms.has(meetingRoomId)) {
            const peers = meetingRooms.get(meetingRoomId);
            peers.delete(socket.id);

            socket.to(meetingRoomId).emit('meeting-remove-peer', {
                peerId: socket.id
            });

            if (peers.size === 0) {
                meetingRooms.delete(meetingRoomId);
            } else {
                io.to(meetingRoomId).emit('meeting-users-update', getMeetingUsers(meetingRoomId));
            }
        }

        meetingSocketRoom.delete(socket.id);
        meetingSocketUser.delete(socket.id);
        meetingMicStatus.delete(socket.id);
        meetingVideoStatus.delete(socket.id);

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
