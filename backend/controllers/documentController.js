const Document = require('../models/Document');
const { LINK_ACCESS, canEdit, getLinkAccess, resolveWorkspaceRole } = require('../utils/permissions');

const DOCUMENT_TYPES = ['text', 'code', 'whiteboard'];

const pick = (source, keys) =>
    keys.reduce((result, key) => {
        if (source[key] !== undefined) {
            result[key] = source[key];
        }
        return result;
    }, {});

const getUntitledTitle = (type) => {
    if (type === 'code') {
        return 'Untitled Code Workspace';
    }

    if (type === 'whiteboard') {
        return 'Untitled Whiteboard';
    }

    return 'Untitled Document';
};

const userIdOf = (req) => req.user?._id || null;

// Metadata used by the editors; also returned to guests who hold a link.
const buildWorkspaceResponse = (document, role) => {
    const response = {
        _id: document._id,
        title: document.title,
        type: document.type,
        updatedAt: document.updatedAt,
        lastModified: document.lastModified,
        linkAccess: getLinkAccess(document),
        role,
        hasCollaborationState: Boolean(document.yjsState?.length),
        owner: document.owner
    };

    if (document.type === 'text' || document.type === 'code') {
        response.legacyContent = document.yjsState?.length ? '' : document.content || '';
    }

    if (document.type === 'code') {
        response.language = document.language || 'javascript';
    }

    return response;
};

exports.createDocument = async (req, res) => {
    try {
        const fields = pick(req.body, ['title', 'content', 'type', 'language', 'linkAccess']);

        if (fields.type !== undefined && !DOCUMENT_TYPES.includes(fields.type)) {
            return res.status(400).json({ message: 'Invalid workspace type' });
        }

        // Older clients send the legacy flag; translate it.
        if (fields.linkAccess === undefined && req.body.shareAccess === 'private') {
            fields.linkAccess = 'none';
        }

        const document = new Document({
            ...fields,
            title: fields.title?.trim() || getUntitledTitle(fields.type),
            owner: req.user._id
        });
        await document.save();
        res.status(201).json(document);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [{ owner: req.user._id }, { collaborators: req.user._id }]
        })
            .select('-yjsState')
            .populate('owner', 'name avatar');
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .select('-yjsState')
            .populate('owner', 'name avatar')
            .populate('collaborators', 'name avatar');

        if (!document || resolveWorkspaceRole(document, req.user._id) === 'none') {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        const role = document ? resolveWorkspaceRole(document, req.user._id) : 'none';

        if (role === 'none') {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!canEdit(role)) {
            return res.status(403).json({ message: 'You only have view access to this workspace' });
        }

        // Ownership, collaborators and stored state can never be changed through this endpoint.
        const updates = pick(req.body, ['title', 'content', 'language']);

        if (req.body.linkAccess !== undefined) {
            if (role !== 'owner') {
                return res.status(403).json({ message: 'Only the owner can change link access' });
            }
            updates.linkAccess = req.body.linkAccess;
        }

        Object.assign(document, updates, { lastModified: Date.now() });
        await document.save();
        res.json(document);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id // Only owner can delete
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found or unauthorized' });
        }
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------------
// Workspace endpoints used by the editors. Guests may call them; access is decided
// by resolveWorkspaceRole (owner / collaborator / the document's link permission).
// ---------------------------------------------------------------------------

const loadForType = async (req, type) => {
    const document = await Document.findById(req.params.id).populate('owner', 'name avatar');

    if (!document || document.type !== type) {
        return { document: null, role: 'none' };
    }

    return { document, role: resolveWorkspaceRole(document, userIdOf(req)) };
};

const getWorkspaceByType = (type) => async (req, res) => {
    try {
        const { document, role } = await loadForType(req, type);

        if (!document || role === 'none') {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json(buildWorkspaceResponse(document, role));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateWorkspaceByType = (type) => async (req, res) => {
    try {
        const { document, role } = await loadForType(req, type);

        if (!document || role === 'none') {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!canEdit(role)) {
            return res.status(403).json({ message: 'You only have view access to this workspace' });
        }

        if (typeof req.body.title === 'string') {
            document.title = req.body.title.trim() || getUntitledTitle(type);
        }

        if (req.body.linkAccess !== undefined) {
            if (role !== 'owner') {
                return res.status(403).json({ message: 'Only the owner can change link access' });
            }
            if (!LINK_ACCESS.includes(req.body.linkAccess)) {
                return res.status(400).json({ message: 'Invalid link access' });
            }
            document.linkAccess = req.body.linkAccess;
        }

        document.lastModified = new Date();
        await document.save();

        return res.json(buildWorkspaceResponse(document, role));
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

exports.getSharedDocument = getWorkspaceByType('text');
exports.updateSharedDocument = updateWorkspaceByType('text');
exports.getSharedCodeDocument = getWorkspaceByType('code');
exports.updateSharedCodeDocument = updateWorkspaceByType('code');
exports.getSharedWhiteboardDocument = getWorkspaceByType('whiteboard');
exports.updateSharedWhiteboardDocument = updateWorkspaceByType('whiteboard');
