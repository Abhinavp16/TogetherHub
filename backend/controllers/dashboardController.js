const Document = require('../models/Document');
const Room = require('../models/Room');
const Team = require('../models/Team');
const { buildJoinPath, normalizeId } = require('../utils/roomWorkspace');

const getDocumentRouteSegment = (type) => {
    if (type === 'text') {
        return 'document';
    }

    return type;
};

exports.getSummary = async (req, res) => {
    try {
        const [documents, rooms, teams] = await Promise.all([
            Document.find({
                $or: [
                    { owner: req.user._id },
                    { collaborators: req.user._id }
                ]
            })
                .sort({ updatedAt: -1 })
                .populate('owner', 'name avatar')
                .populate('collaborators', 'name avatar'),
            Room.find({
                isActive: true,
                $or: [
                    { visibility: 'public' },
                    { owner: req.user._id },
                    { members: req.user._id },
                    { invites: req.user.email }
                ]
            }).populate('members', 'name avatar'),
            Team.find({ 'members.userId': req.user._id }).populate('members.userId', 'name avatar')
        ]);

        const collaboratorIds = new Set();

        documents.forEach((document) => {
            if (normalizeId(document.owner) !== normalizeId(req.user._id)) {
                collaboratorIds.add(normalizeId(document.owner));
            }

            (document.collaborators || []).forEach((collaborator) => {
                const collaboratorId = normalizeId(collaborator);
                if (collaboratorId && collaboratorId !== normalizeId(req.user._id)) {
                    collaboratorIds.add(collaboratorId);
                }
            });
        });

        rooms.forEach((room) => {
            (room.members || []).forEach((member) => {
                const memberId = normalizeId(member);
                if (memberId && memberId !== normalizeId(req.user._id)) {
                    collaboratorIds.add(memberId);
                }
            });
        });

        teams.forEach((team) => {
            (team.members || []).forEach((member) => {
                const memberId = normalizeId(member.userId);
                if (memberId && memberId !== normalizeId(req.user._id)) {
                    collaboratorIds.add(memberId);
                }
            });
        });

        const recentWorkspaces = documents.slice(0, 6).map((document) => ({
            id: document._id,
            title: document.title,
            type: getDocumentRouteSegment(document.type),
            updatedAt: document.updatedAt,
            collaboratorCount: (document.collaborators?.length || 0) + 1,
            joinPath: `/${getDocumentRouteSegment(document.type)}/${document._id}`
        }));

        const recentRooms = rooms
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 6)
            .map((room) => ({
                id: room._id,
                name: room.name,
                type: room.type,
                updatedAt: room.updatedAt,
                memberCount: room.members?.length || 0,
                joinPath: buildJoinPath(room)
            }));

        return res.json({
            stats: {
                workspaceCount: documents.length,
                roomCount: rooms.length,
                teamCount: teams.length,
                collaboratorCount: collaboratorIds.size
            },
            recentWorkspaces,
            recentRooms
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
