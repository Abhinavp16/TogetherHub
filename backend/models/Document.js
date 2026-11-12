const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['text', 'code', 'whiteboard'],
        default: 'text'
    },
    language: {
        type: String,
        default: 'javascript' // For code documents
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Legacy flag kept for workspaces created before link permissions; see utils/permissions.js.
    shareAccess: {
        type: String,
        enum: ['link', 'private'],
        default: 'link'
    },
    // What someone who only has the link may do: nothing, view, or edit.
    linkAccess: {
        type: String,
        enum: ['none', 'view', 'edit']
    },
    yjsState: {
        type: Buffer,
        default: null
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
