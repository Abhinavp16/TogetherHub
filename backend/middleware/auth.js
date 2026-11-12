const { getBearerToken, getUserFromToken } = require('../utils/authHelpers');

// Requires a valid, unexpired token.
const auth = async (req, res, next) => {
    const token = getBearerToken(req);
    const user = await getUserFromToken(token);

    if (!user) {
        return res.status(401).send({ error: 'Please authenticate.' });
    }

    req.token = token;
    req.user = user;
    next();
};

// Attaches the user when a valid token is present; otherwise continues as a guest.
const optionalAuth = async (req, res, next) => {
    const user = await getUserFromToken(getBearerToken(req));
    if (user) {
        req.user = user;
    }
    next();
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
