const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const config = require('./config');
const { createApp } = require('./app');
const { createCollaborationServer } = require('./collaborationServer');
const { registerMeetingHandlers } = require('./sockets/meeting');

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});
registerMeetingHandlers(io);

mongoose
    .connect(config.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const collaborationServer = createCollaborationServer();

server.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});

collaborationServer
    .listen()
    .then(() => {
        console.log(`Collaboration server is running on port ${config.COLLAB_PORT}`);
    })
    .catch((error) => {
        console.error('Failed to start collaboration server:', error);
    });
