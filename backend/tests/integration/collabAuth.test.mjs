// Live-editing access control: who may open a session, and viewers are read-only.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import collabModule from '../../collaborationServer.js';
import { authed, connectReplica, createTestApp, freePort, signup, startDatabase, waitFor } from '../helpers.mjs';

let stopDatabase;
let app;
let collab;
let url;

beforeAll(async () => {
    stopDatabase = await startDatabase();
    app = createTestApp();
    const port = await freePort();
    collab = collabModule.createCollaborationServer({ port, address: '127.0.0.1' });
    await collab.listen();
    url = `ws://127.0.0.1:${port}`;
});

afterAll(async () => {
    await collab.destroy();
    await stopDatabase();
});

describe('session admission by role', () => {
    it('admits the owner and members of a private room, refuses guests and outsiders (bug 10)', async () => {
        const owner = await signup(app, 'owner');
        const member = await signup(app, 'member');
        const outsider = await signup(app, 'outsider');
        const room = (
            await authed(app, owner.token).post('/api/rooms', {
                name: 'private',
                type: 'document',
                isPrivate: true,
                invites: [member.email]
            })
        ).body;
        await authed(app, member.token).post(`/api/rooms/${room._id}/join`);

        const ownerSession = await connectReplica(url, room.documentId, { token: owner.token });
        const memberSession = await connectReplica(url, room.documentId, { token: member.token });
        await expect(connectReplica(url, room.documentId, { token: outsider.token })).rejects.toThrow(/not admitted/);
        await expect(connectReplica(url, room.documentId, { token: 'guest' })).rejects.toThrow(/not admitted/);
        ownerSession.provider.destroy();
        memberSession.provider.destroy();
    });

    it('treats an expired or forged token as a guest', async () => {
        const owner = await signup(app, 'owner');
        const id = (
            await authed(app, owner.token).post('/api/documents', { title: 'x', type: 'text', linkAccess: 'none' })
        ).body._id;
        await expect(connectReplica(url, id, { token: 'forged.token.value' })).rejects.toThrow(/not admitted/);
    });

    it('makes view-only link sessions read-only', async () => {
        const owner = await signup(app, 'owner');
        const id = (
            await authed(app, owner.token).post('/api/documents', { title: 'x', type: 'code', linkAccess: 'view' })
        ).body._id;

        const editor = await connectReplica(url, id, { token: owner.token });
        const viewer = await connectReplica(url, id, { token: 'guest' });

        editor.doc.getText('t').insert(0, 'from owner');
        expect(await waitFor(() => viewer.doc.getText('t').toString() === 'from owner')).toBe(true);

        viewer.doc.getText('t').insert(0, 'VANDAL ');
        await new Promise((r) => setTimeout(r, 400));
        expect(editor.doc.getText('t').toString()).toBe('from owner');

        editor.provider.destroy();
        viewer.provider.destroy();
    });

    it('refuses malformed workspace names', async () => {
        await expect(connectReplica(url, 'not-an-id', { token: 'guest' })).rejects.toThrow(/not admitted/);
    });
});
