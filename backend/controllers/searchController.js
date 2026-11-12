const Document = require('../models/Document');
const Room = require('../models/Room');
const { buildJoinPath } = require('../utils/roomWorkspace');
const { normalizeEmail } = require('../utils/permissions');

const ROUTE_FOR_TYPE = { text: 'document', code: 'code', whiteboard: 'whiteboard' };
const LIMIT = 8;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Searches the workspaces and rooms the signed-in user can access. An empty query returns recent items.
exports.search = async (req, res) => {
    try {
        const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
        const nameFilter = query ? { $regex: escapeRegex(query), $options: 'i' } : undefined;

        const [documents, rooms] = await Promise.all([
            Document.find({
                $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
                ...(nameFilter ? { title: nameFilter } : {})
            })
                .select('title type updatedAt')
                .sort({ updatedAt: -1 })
                .limit(LIMIT),
            Room.find({
                isActive: true,
                $or: [
                    { visibility: 'public' },
                    { owner: req.user._id },
                    { members: req.user._id },
                    { invites: normalizeEmail(req.user.email) }
                ],
                ...(nameFilter ? { name: nameFilter } : {})
            })
                .select('name type documentId updatedAt')
                .sort({ updatedAt: -1 })
                .limit(LIMIT)
        ]);

        const results = [
            ...documents.map((document) => ({
                id: String(document._id),
                kind: 'workspace',
                type: ROUTE_FOR_TYPE[document.type] || 'document',
                title: document.title,
                path: `/${ROUTE_FOR_TYPE[document.type] || 'document'}/${document._id}`,
                updatedAt: document.updatedAt
            })),
            ...rooms.map((room) => ({
                id: String(room._id),
                kind: 'room',
                type: room.type,
                title: room.name,
                path: buildJoinPath(room) || '/rooms',
                updatedAt: room.updatedAt
            }))
        ]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, LIMIT);

        res.json({ query, results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
