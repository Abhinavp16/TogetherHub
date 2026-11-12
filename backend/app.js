const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

// Builds the Express application without opening any sockets, so tests can import it directly.
const createApp = () => {
    const app = express();

    app.use(
        cors({
            origin: config.allowedOrigins,
            credentials: true
        })
    );
    app.use(express.json());
    if (config.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }

    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/teams', require('./routes/teams'));
    app.use('/api/dashboard', require('./routes/dashboard'));
    app.use('/api/documents', require('./routes/documents'));
    app.use('/api/public/documents', require('./routes/publicDocuments'));
    app.use('/api/public/code', require('./routes/publicCode'));
    app.use('/api/public/whiteboards', require('./routes/publicWhiteboards'));
    app.use('/api/rooms', require('./routes/rooms'));
    app.use('/api/search', require('./routes/search'));

    app.get('/', (req, res) => {
        res.json({ message: 'Together Hub API is running' });
    });

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    return app;
};

module.exports = { createApp };
