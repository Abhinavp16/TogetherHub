const User = require('../models/User');
const { serializeUser } = require('../utils/authHelpers');
const { normalizeEmail } = require('../utils/permissions');

exports.getProfile = async (req, res) => {
    res.json(serializeUser(req.user));
};

exports.updateProfile = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'avatar'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        res.json(serializeUser(req.user));
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// Exact-match lookup used when inviting someone; never lists the user directory.
exports.lookupUser = async (req, res) => {
    try {
        const email = normalizeEmail(req.query.email);
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email }, 'name avatar');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ id: user._id, name: user.name, avatar: user.avatar });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
