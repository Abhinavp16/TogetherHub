const mongoose = require('mongoose');
const Room = require('./models/Room');
const { ensureWorkspaceForRoom, isWorkspaceRoom, normalizeId } = require('./utils/roomWorkspace');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/togetherhub';

const runMigration = async () => {
    await mongoose.connect(MONGODB_URI);

    const rooms = await Room.find({
        type: { $in: ['document', 'code', 'whiteboard'] }
    });

    let createdOrRepaired = 0;
    let alreadyLinked = 0;

    for (const room of rooms) {
        if (!isWorkspaceRoom(room)) {
            continue;
        }

        const previousDocumentId = normalizeId(room.documentId);
        await ensureWorkspaceForRoom(room);
        const nextDocumentId = normalizeId(room.documentId);

        if (previousDocumentId === nextDocumentId && previousDocumentId) {
            alreadyLinked += 1;
            continue;
        }

        createdOrRepaired += 1;
        console.log(`Linked room "${room.name}" (${room._id}) -> document ${nextDocumentId}`);
    }

    console.log(`Migration complete. Repaired or created links for ${createdOrRepaired} rooms.`);
    console.log(`Already linked rooms skipped: ${alreadyLinked}.`);
};

runMigration()
    .then(async () => {
        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Room workspace migration failed:', error);
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            console.error('Failed to close MongoDB connection:', disconnectError);
        }
        process.exit(1);
    });
