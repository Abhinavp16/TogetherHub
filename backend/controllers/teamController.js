const Team = require('../models/Team');
const User = require('../models/User');

const TEAM_MANAGE_ROLES = new Set(['owner', 'admin']);

const normalizeId = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === 'object' && value._id) {
        return value._id.toString();
    }

    return value.toString();
};

const serializeTeam = (team, currentUserId) => {
    const ownerId = normalizeId(team.owner);
    const members = (team.members || []).map((member) => {
        const user = member.userId || {};
        return {
            userId: normalizeId(user._id || member.userId),
            role: member.role,
            name: user.name,
            email: user.email,
            avatar: user.avatar
        };
    });

    const membership = members.find((member) => member.userId === normalizeId(currentUserId)) || null;

    return {
        _id: team._id,
        name: team.name,
        description: team.description || '',
        owner: team.owner && typeof team.owner === 'object' && team.owner.name
            ? {
                id: ownerId,
                name: team.owner.name,
                email: team.owner.email,
                avatar: team.owner.avatar
            }
            : { id: ownerId },
        members,
        memberCount: members.length,
        membershipRole: membership?.role || null,
        canManage: membership ? TEAM_MANAGE_ROLES.has(membership.role) : false,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
    };
};

const getMembership = (team, userId) => {
    return (team.members || []).find((member) => normalizeId(member.userId) === normalizeId(userId)) || null;
};

const requireTeamAccess = async (teamId, userId) => {
    const team = await Team.findById(teamId)
        .populate('owner', 'name email avatar')
        .populate('members.userId', 'name email avatar');

    if (!team) {
        return { error: { status: 404, message: 'Team not found' } };
    }

    const membership = getMembership(team, userId);
    if (!membership) {
        return { error: { status: 403, message: 'You do not have access to this team' } };
    }

    return { team, membership };
};

const requireTeamManageAccess = async (teamId, userId) => {
    const result = await requireTeamAccess(teamId, userId);
    if (result.error) {
        return result;
    }

    if (!TEAM_MANAGE_ROLES.has(result.membership.role)) {
        return { error: { status: 403, message: 'You do not have permission to manage this team' } };
    }

    return result;
};

exports.getTeams = async (req, res) => {
    try {
        const teams = await Team.find({ 'members.userId': req.user._id })
            .sort({ updatedAt: -1 })
            .populate('owner', 'name email avatar')
            .populate('members.userId', 'name email avatar');

        res.json(teams.map((team) => serializeTeam(team, req.user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createTeam = async (req, res) => {
    try {
        const team = new Team({
            name: req.body.name?.trim(),
            description: req.body.description?.trim() || '',
            owner: req.user._id,
            members: [{
                userId: req.user._id,
                role: 'owner'
            }]
        });

        await team.save();
        await team.populate('owner', 'name email avatar');
        await team.populate('members.userId', 'name email avatar');

        res.status(201).json(serializeTeam(team, req.user._id));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getTeam = async (req, res) => {
    try {
        const result = await requireTeamAccess(req.params.id, req.user._id);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }

        return res.json(serializeTeam(result.team, req.user._id));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.addTeamMember = async (req, res) => {
    try {
        const result = await requireTeamManageAccess(req.params.id, req.user._id);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }

        const email = req.body.email?.trim().toLowerCase();
        const role = req.body.role || 'viewer';

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingMember = getMembership(result.team, user._id);
        if (existingMember) {
            return res.status(400).json({ message: 'User is already a team member' });
        }

        result.team.members.push({
            userId: user._id,
            role
        });

        await result.team.save();
        await result.team.populate('owner', 'name email avatar');
        await result.team.populate('members.userId', 'name email avatar');

        return res.json(serializeTeam(result.team, req.user._id));
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

exports.updateTeamMember = async (req, res) => {
    try {
        const result = await requireTeamManageAccess(req.params.id, req.user._id);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }

        const targetMember = getMembership(result.team, req.params.userId);
        if (!targetMember) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        if (targetMember.role === 'owner') {
            return res.status(400).json({ message: 'Owner role cannot be changed' });
        }

        targetMember.role = req.body.role || targetMember.role;
        await result.team.save();
        await result.team.populate('owner', 'name email avatar');
        await result.team.populate('members.userId', 'name email avatar');

        return res.json(serializeTeam(result.team, req.user._id));
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

exports.removeTeamMember = async (req, res) => {
    try {
        const result = await requireTeamManageAccess(req.params.id, req.user._id);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }

        const targetMember = getMembership(result.team, req.params.userId);
        if (!targetMember) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        if (targetMember.role === 'owner') {
            return res.status(400).json({ message: 'Owner cannot be removed from the team' });
        }

        result.team.members = result.team.members.filter(
            (member) => normalizeId(member.userId) !== normalizeId(req.params.userId)
        );

        await result.team.save();
        await result.team.populate('owner', 'name email avatar');
        await result.team.populate('members.userId', 'name email avatar');

        return res.json(serializeTeam(result.team, req.user._id));
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
