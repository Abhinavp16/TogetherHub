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

const linkAccessForVisibility = (room) => (room.visibility === 'private' ? 'none' : 'edit');

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
        linkAccess: linkAccessForVisibility(room),
        lastModified: new Date()
    };
};

// Keeps workspace collaborators equal to the room's members (minus the owner).
// Title and link access belong to the workspace owner after creation and are not overwritten.
const syncDocumentCollaborators = async (document, room) => {
    const ownerId = getRoomOwnerId(room);
    const desiredCollaborators = getRoomMemberIds(room).filter((memberId) => memberId !== ownerId);
    const currentCollaborators = (document.collaborators || []).map(normalizeId).filter(Boolean);

    const isSameLength = currentCollaborators.length === desiredCollaborators.length;
    const hasSameCollaborators =
        isSameLength && currentCollaborators.every((collaboratorId) => desiredCollaborators.includes(collaboratorId));

    if (!hasSameCollaborators) {
        document.collaborators = desiredCollaborators;
    }

    // Workspaces created before link permissions existed get one derived from the room once.
    if (!document.linkAccess) {
        document.linkAccess = linkAccessForVisibility(room);
    }

    if (document.isModified()) {
        document.lastModified = new Date();
        await document.save();
    }
};

// Creates a workspace and links it to the room only if the room still points at `expectedDocumentId`.
// Concurrent requests race on that compare-and-set; losers delete their copy and adopt the winner's.
const provisionWorkspace = async (room, expectedDocumentId) => {
    const Room = require('../models/Room');
    const document = await Document.create(getDocumentPayloadForRoom(room));
    const linked = await Room.findOneAndUpdate(
        { _id: room._id, documentId: expectedDocumentId },
        { $set: { documentId: document._id } },
        { new: true }
    );

    if (linked) {
        room.documentId = document._id;
    } else {
        await Document.deleteOne({ _id: document._id });
        const current = await Room.findById(room._id).select('documentId');
        room.documentId = current?.documentId ?? null;
    }

    // The value now matches the database; don't let a later room.save() treat it as a change.
    if (typeof room.unmarkModified === 'function') {
        room.unmarkModified('documentId');
    }
    return room;
};

const ensureWorkspaceForRoom = async (room) => {
    if (!room || !isWorkspaceRoom(room)) {
        return room;
    }

    if (!room.documentId) {
        return provisionWorkspace(room, null);
    }

    const document = await Document.findById(room.documentId);

    if (!document) {
        return provisionWorkspace(room, room.documentId);
    }

    await syncDocumentCollaborators(document, room);
    return room;
};

const buildJoinPath = (room) => {
    if (!room) {
        return null;
    }

    const roomId = normalizeId(room._id);
    if (room.type === 'video') {
        return roomId ? `/video/${roomId}` : null;
    }

    const documentId = normalizeId(room.documentId);
    if (!documentId) {
        return null;
    }

    const routeSegment = room.type === 'document' ? 'document' : room.type;
    return `/${routeSegment}/${documentId}`;
};

const serializeRoomResponse = (room) => {
    const base = typeof room.toObject === 'function' ? room.toObject() : { ...room };
    const documentId = normalizeId(base.documentId);

    return {
        ...base,
        documentId,
        joinPath: buildJoinPath(base)
    };
};

module.exports = {
    ROOM_DOCUMENT_TYPE_MAP,
    buildJoinPath,
    ensureWorkspaceForRoom,
    isWorkspaceRoom,
    normalizeId,
    serializeRoomResponse
};
