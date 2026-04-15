const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'editor', 'viewer'],
        default: 'viewer'
    }
}, { _id: false });

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: {
        type: [teamMemberSchema],
        default: []
    }
}, { timestamps: true });

teamSchema.index({ owner: 1, updatedAt: -1 });
teamSchema.index({ 'members.userId': 1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
