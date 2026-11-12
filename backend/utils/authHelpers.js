const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const signAuthToken = (user) => {
    return jwt.sign({ _id: user._id.toString() }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
};

// Resolves a bearer token to its user, or null when the token is missing, invalid, expired or orphaned.
const getUserFromToken = async (token) => {
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        return await User.findById(decoded._id);
    } catch {
        return null;
    }
};

const getBearerToken = (req) => req.header('Authorization')?.replace(/^Bearer\s+/i, '') || null;

const serializeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider
});

module.exports = {
    getBearerToken,
    getUserFromToken,
    serializeUser,
    signAuthToken
};
