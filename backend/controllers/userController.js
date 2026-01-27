const User = require('../models/User');

exports.getProfile = async (req, res) => {
    res.json(req.user);
};

exports.updateProfile = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'avatar'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name email avatar');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
