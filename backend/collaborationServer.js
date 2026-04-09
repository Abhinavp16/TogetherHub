const { Server } = require('@hocuspocus/server');
const Y = require('yjs');
const Document = require('./models/Document');

const createCollaborationServer = () => {
    const port = Number(process.env.COLLAB_PORT || 1234);
    const address = process.env.COLLAB_HOST || '0.0.0.0';

    const server = new Server({
        name: 'TogetherHub Collaboration',
        address,
        port,
        quiet: true,
        debounce: 1500,
        maxDebounce: 5000,
        async onLoadDocument(data) {
            const persistedDocument = await Document.findById(data.documentName).select('type shareAccess yjsState');

            if (!persistedDocument || persistedDocument.type !== 'text') {
                throw new Error('Collaborative document not found');
            }

            if (persistedDocument.shareAccess === 'private') {
                throw new Error('Document is private');
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
