const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'your_jwt_secret_key';

const signAuthToken = (user) => {
    return jwt.sign({ _id: user._id.toString() }, getJwtSecret());
};

const serializeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider
});

module.exports = {
    serializeUser,
    signAuthToken
};
