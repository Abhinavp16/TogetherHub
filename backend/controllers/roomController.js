const Room = require('../models/Room');
const Document = require('../models/Document');

const ROOM_DOCUMENT_TYPE_MAP = {
    document: 'text',
    code: 'code',
    whiteboard: 'whiteboard'
};

const normalizeId = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === 'object' && value._id) {
        return value._id.toString();
    }

    return value.toString();
};

const getRoomMemberIds = (room) => {
    return (room.members || []).map(normalizeId).filter(Boolean);
};

const getRoomOwnerId = (room) => {
    return normalizeId(room.owner);
};

const isWorkspaceRoom = (room) => {
    return Object.prototype.hasOwnProperty.call(ROOM_DOCUMENT_TYPE_MAP, room.type);
};

const getDocumentPayloadForRoom = (room) => {
    const ownerId = getRoomOwnerId(room);
    const collaboratorIds = getRoomMemberIds(room).filter((memberId) => memberId !== ownerId);

    return {
        title: room.name?.trim() || 'Untitled Workspace',
        content: '',
        type: ROOM_DOCUMENT_TYPE_MAP[room.type],
        language: room.type === 'code' ? 'javascript' : undefined,
        owner: ownerId,
        collaborators: collaboratorIds,
        shareAccess: room.visibility === 'private' ? 'private' : 'link',
        lastModified: new Date()
    };
};

const syncDocumentCollaborators = async (document, room) => {
    const ownerId = getRoomOwnerId(room);
    const desiredCollaborators = getRoomMemberIds(room).filter((memberId) => memberId !== ownerId);
    const currentCollaborators = (document.collaborators || []).map(normalizeId).filter(Boolean);

    const isSameLength = currentCollaborators.length === desiredCollaborators.length;
    const hasSameCollaborators = isSameLength
        && currentCollaborators.every((collaboratorId) => desiredCollaborators.includes(collaboratorId));

    if (!hasSameCollaborators) {
        document.collaborators = desiredCollaborators;
    }

    const desiredShareAccess = room.visibility === 'private' ? 'private' : 'link';
    if (document.shareAccess !== desiredShareAccess) {
        document.shareAccess = desiredShareAccess;
    }

    const desiredTitle = room.name?.trim() || document.title;
    if (desiredTitle && document.title !== desiredTitle) {
        document.title = desiredTitle;
    }

    if (document.isModified()) {
        document.lastModified = new Date();
        await document.save();
    }
};

const ensureWorkspaceForRoom = async (room) => {
    if (!room || !isWorkspaceRoom(room)) {
        return room;
    }

    if (!room.documentId) {
        const document = await Document.create(getDocumentPayloadForRoom(room));
        room.documentId = document._id;
        await room.save();
        return room;
    }

    const document = await Document.findById(room.documentId);

    if (!document) {
        const recreatedDocument = await Document.create(getDocumentPayloadForRoom(room));
        room.documentId = recreatedDocument._id;
        await room.save();
        return room;
    }

    await syncDocumentCollaborators(document, room);
    return room;
};

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
        await ensureWorkspaceForRoom(room);
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
        await Promise.all(rooms.map((room) => ensureWorkspaceForRoom(room)));
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
        await ensureWorkspaceForRoom(room);
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

        await ensureWorkspaceForRoom(room);

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
        await ensureWorkspaceForRoom(room);

        res.json({ message: 'Left room successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
