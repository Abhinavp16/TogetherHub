const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['document', 'code', 'whiteboard', 'video'],
        default: 'document'
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    invites: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    meetingSettings: {
        allowChat: {
            type: Boolean,
            default: true
        },
        allowScreenShare: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
