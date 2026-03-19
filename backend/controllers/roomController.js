const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
    try {
        const {
            name,
            description,
            type = 'document',
            isPrivate = false,
            invites = []
        } = req.body;

        const room = new Room({
            name,
            description,
            type,
            visibility: isPrivate ? 'private' : 'public',
            invites,
            owner: req.user._id,
            members: [req.user._id]
        });
        await room.save();
        const populatedRoom = await room.populate([
            { path: 'owner', select: 'name avatar email' },
            { path: 'members', select: 'name avatar email' }
        ]);
        res.status(201).json(populatedRoom);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isActive: true })
            .populate('owner', 'name avatar')
            .populate('members', 'name avatar');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('owner', 'name avatar')
            .populate('members', 'name avatar');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.joinRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const isMember = room.members.some(
            (memberId) => memberId.toString() === req.user._id.toString()
        );

        if (!isMember) {
            room.members.push(req.user._id);
            await room.save();
        }

        const populatedRoom = await room.populate([
            { path: 'owner', select: 'name avatar email' },
            { path: 'members', select: 'name avatar email' }
        ]);

        res.json(populatedRoom);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.leaveRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        room.members = room.members.filter(memberId => memberId.toString() !== req.user._id.toString());
        await room.save();

        res.json({ message: 'Left room successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
