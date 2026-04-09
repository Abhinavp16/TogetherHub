const Document = require('../models/Document');

const findSharedDocument = async (id) => {
    return Document.findById(id).populate('owner', 'name avatar');
};

exports.createDocument = async (req, res) => {
    try {
        const document = new Document({
            ...req.body,
            owner: req.user._id,
            shareAccess: req.body.shareAccess || 'link'
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
            $or: [
                { owner: req.user._id },
                { collaborators: req.user._id }
            ]
        }).populate('owner', 'name avatar');
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user._id },
                { collaborators: req.user._id }
            ]
        }).populate('owner', 'name avatar')
            .populate('collaborators', 'name avatar');

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDocument = async (req, res) => {
    try {
        const document = await Document.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [
                    { owner: req.user._id },
                    { collaborators: req.user._id }
                ]
            },
            { ...req.body, lastModified: Date.now() },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
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

exports.getSharedDocument = async (req, res) => {
    try {
        const document = await findSharedDocument(req.params.id);

        if (!document || document.type !== 'text' || document.shareAccess === 'private') {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json({
            _id: document._id,
            title: document.title,
            type: document.type,
            updatedAt: document.updatedAt,
            lastModified: document.lastModified,
            shareAccess: document.shareAccess || 'link',
            hasCollaborationState: Boolean(document.yjsState?.length),
            legacyContent: document.yjsState?.length ? '' : (document.content || ''),
            owner: document.owner
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSharedDocument = async (req, res) => {
    try {
        const updates = {};

        if (typeof req.body.title === 'string') {
            updates.title = req.body.title.trim() || 'Untitled Document';
        }

        if (typeof req.body.shareAccess === 'string') {
            updates.shareAccess = req.body.shareAccess;
        }

        updates.lastModified = new Date();

        const document = await Document.findById(req.params.id);

        if (!document || document.type !== 'text' || document.shareAccess === 'private') {
            return res.status(404).json({ message: 'Document not found' });
        }

        Object.assign(document, updates);
        await document.save();

        res.json({
            _id: document._id,
            title: document.title,
            updatedAt: document.updatedAt,
            lastModified: document.lastModified,
            shareAccess: document.shareAccess || 'link'
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
