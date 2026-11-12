const { normalizeId } = require('./roomWorkspace');

const LINK_ACCESS = ['none', 'view', 'edit'];

// Workspaces created before link permissions existed only have the legacy `shareAccess` flag.
const getLinkAccess = (document) => {
    if (LINK_ACCESS.includes(document.linkAccess)) {
        return document.linkAccess;
    }
    return document.shareAccess === 'private' ? 'none' : 'edit';
};

// Role of a user (or a guest when userId is empty) on a workspace: owner, editor, viewer or none.
const resolveWorkspaceRole = (document, userId) => {
    const uid = userId ? String(userId) : null;

    if (uid && normalizeId(document.owner) === uid) {
        return 'owner';
    }

    if (uid && (document.collaborators || []).some((collaborator) => normalizeId(collaborator) === uid)) {
        return 'editor';
    }

    const linkAccess = getLinkAccess(document);
    if (linkAccess === 'edit') return 'editor';
    if (linkAccess === 'view') return 'viewer';
    return 'none';
};

const canEdit = (role) => role === 'owner' || role === 'editor';

const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

const isRoomOwner = (room, userId) => normalizeId(room.owner) === normalizeId(userId);

const isRoomMember = (room, userId) =>
    (room.members || []).some((memberId) => normalizeId(memberId) === normalizeId(userId));

const isRoomInvited = (room, email) => (room.invites || []).includes(normalizeEmail(email));

const canAccessRoom = (room, user) => {
    if (room.visibility === 'public') {
        return true;
    }
    return isRoomOwner(room, user._id) || isRoomMember(room, user._id) || isRoomInvited(room, user.email);
};

module.exports = {
    LINK_ACCESS,
    canAccessRoom,
    canEdit,
    getLinkAccess,
    isRoomInvited,
    isRoomMember,
    isRoomOwner,
    normalizeEmail,
    resolveWorkspaceRole
};
