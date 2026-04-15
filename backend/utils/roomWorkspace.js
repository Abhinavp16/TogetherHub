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
