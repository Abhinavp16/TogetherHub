const { Server } = require('@hocuspocus/server');
const mongoose = require('mongoose');
const Y = require('yjs');
const Document = require('./models/Document');
const config = require('./config');
const { getUserFromToken } = require('./utils/authHelpers');
const { resolveWorkspaceRole } = require('./utils/permissions');

const COLLABORATIVE_TYPES = ['text', 'code', 'whiteboard'];

const createCollaborationServer = ({ port = config.COLLAB_PORT, address = config.COLLAB_HOST } = {}) => {
    const server = new Server({
        name: 'TogetherHub Collaboration',
        address,
        port,
        quiet: true,
        debounce: 1500,
        maxDebounce: 5000,
        // Runs before a session is admitted. Clients send their login token, or "guest" when signed out.
        async onAuthenticate({ token, documentName, connectionConfig }) {
            if (!mongoose.isValidObjectId(documentName)) {
                throw new Error('Workspace not found');
            }

            const document = await Document.findById(documentName).select(
                'type owner collaborators linkAccess shareAccess'
            );
            if (!document || !COLLABORATIVE_TYPES.includes(document.type)) {
                throw new Error('Workspace not found');
            }

            const user = token && token !== 'guest' ? await getUserFromToken(token) : null;
            const role = resolveWorkspaceRole(document, user?._id);

            if (role === 'none') {
                throw new Error('You do not have access to this workspace');
            }

            // Viewers receive updates but anything they send is discarded by the server.
            if (role === 'viewer') {
                connectionConfig.readOnly = true;
            }

            return { role, userId: user ? user._id.toString() : null };
        },
        async onLoadDocument(data) {
            const persistedDocument = await Document.findById(data.documentName).select('type yjsState');

            if (!persistedDocument || !COLLABORATIVE_TYPES.includes(persistedDocument.type)) {
                throw new Error('Collaborative document not found');
            }

            if (persistedDocument.yjsState?.length) {
                Y.applyUpdate(data.document, new Uint8Array(persistedDocument.yjsState));
            }

            return data.document;
        },
        async onStoreDocument({ documentName, document }) {
            await Document.findByIdAndUpdate(documentName, {
                yjsState: Buffer.from(Y.encodeStateAsUpdate(document)),
                lastModified: new Date()
            });
        }
    });

    return server;
};

module.exports = {
    createCollaborationServer
};
