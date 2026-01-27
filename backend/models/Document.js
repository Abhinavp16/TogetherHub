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
    lastModified: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
