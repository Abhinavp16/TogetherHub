const Room = require('../models/Room');
const Team = require('../models/Team');
const {
    ensureWorkspaceForRoom,
    normalizeId,
    serializeRoomResponse
} = require('../utils/roomWorkspace');

const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

const dedupeEmails = (emails) => {
    return Array.from(new Set((emails || []).map(normalizeEmail).filter(Boolean)));
};

const isRoomMember = (room, userId) => {
    return room.members.some((memberId) => normalizeId(memberId) === normalizeId(userId));
};

const isRoomOwner = (room, userId) => normalizeId(room.owner) === normalizeId(userId);

const isRoomInvited = (room, email) => room.invites.includes(normalizeEmail(email));

const canAccessRoom = (room, user) => {
    if (room.visibility === 'public') {
        return true;
    }

    return isRoomOwner(room, user._id) || isRoomMember(room, user._id) || isRoomInvited(room, user.email);
};

const canManageRoomInvites = (room, user) => {
    return isRoomOwner(room, user._id) || isRoomMember(room, user._id);
};

const getAccessibleRoomFilter = (user) => ({
    isActive: true,
    $or: [
        { visibility: 'public' },
        { owner: user._id },
        { members: user._id },
        { invites: normalizeEmail(user.email) }
    ]
});

const resolveTeamInviteEmails = async (teamId, user) => {
    if (!teamId) {
        return [];
    }

    const team = await Team.findOne({
        _id: teamId,
        'members.userId': user._id
    }).populate('members.userId', 'email');

    if (!team) {
        const error = new Error('Team not found');
        error.statusCode = 404;
        throw error;
    }

    return dedupeEmails(
        team.members.map((member) => member.userId?.email).filter((email) => normalizeEmail(email) !== normalizeEmail(user.email))
    );
};

exports.createRoom = async (req, res) => {
    try {
        const {
            name,
            description,
            type = 'document',
            isPrivate = false,
            invites = [],
            teamId = ''
        } = req.body;

        const manualInvites = dedupeEmails(invites).filter((email) => email !== normalizeEmail(req.user.email));
        const teamInvites = await resolveTeamInviteEmails(teamId, req.user);

        const room = new Room({
            name,
            description,
            type,
            visibility: isPrivate ? 'private' : 'public',
            invites: dedupeEmails([...manualInvites, ...teamInvites]),
            owner: req.user._id,
            members: [req.user._id]
        });
        await room.save();
        await ensureWorkspaceForRoom(room);
        const populatedRoom = await room.populate([
            { path: 'owner', select: 'name avatar email' },
            { path: 'members', select: 'name avatar email' }
        ]);
        res.status(201).json(serializeRoomResponse(populatedRoom));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find(getAccessibleRoomFilter(req.user))
            .populate('owner', 'name avatar')
            .populate('members', 'name avatar');
        await Promise.all(rooms.map((room) => ensureWorkspaceForRoom(room)));
        res.json(rooms.map((room) => serializeRoomResponse(room)));
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
        if (!canAccessRoom(room, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this room' });
        }
        await ensureWorkspaceForRoom(room);
        res.json(serializeRoomResponse(room));
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

        if (!canAccessRoom(room, req.user)) {
            return res.status(403).json({ message: 'You do not have access to join this room' });
        }

        const isMember = isRoomMember(room, req.user._id);

        if (!isMember) {
            room.members.push(req.user._id);
        }

        if (isRoomInvited(room, req.user.email)) {
            room.invites = room.invites.filter((email) => email !== normalizeEmail(req.user.email));
        }

        await room.save();

        await ensureWorkspaceForRoom(room);

        const populatedRoom = await room.populate([
            { path: 'owner', select: 'name avatar email' },
            { path: 'members', select: 'name avatar email' }
        ]);

        res.json(serializeRoomResponse(populatedRoom));
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
        await ensureWorkspaceForRoom(room);

        res.json({ message: 'Left room successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.addInvite = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('owner', 'name avatar email')
            .populate('members', 'name avatar email');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!canManageRoomInvites(room, req.user)) {
            return res.status(403).json({ message: 'You do not have permission to invite people to this room' });
        }

        const email = normalizeEmail(req.body.email);
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const existingMemberEmails = new Set(
            [room.owner?.email, ...(room.members || []).map((member) => member.email)].map(normalizeEmail).filter(Boolean)
        );

        if (existingMemberEmails.has(email)) {
            return res.status(400).json({ message: 'User is already part of this room' });
        }

        room.invites = dedupeEmails([...(room.invites || []), email]);
        await room.save();

        return res.json(serializeRoomResponse(room));
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

exports.addTeamInvites = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('owner', 'name avatar email')
            .populate('members', 'name avatar email');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!canManageRoomInvites(room, req.user)) {
            return res.status(403).json({ message: 'You do not have permission to invite people to this room' });
        }

        const teamInvites = await resolveTeamInviteEmails(req.body.teamId, req.user);
        const existingMemberEmails = new Set(
            [room.owner?.email, ...(room.members || []).map((member) => member.email)].map(normalizeEmail).filter(Boolean)
        );

        room.invites = dedupeEmails([
            ...(room.invites || []),
            ...teamInvites.filter((email) => !existingMemberEmails.has(email))
        ]);
        await room.save();

        return res.json(serializeRoomResponse(room));
    } catch (error) {
        return res.status(error.statusCode || 400).json({ message: error.message });
    }
};
