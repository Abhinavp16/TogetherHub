// Collaboration server: session admission, live sync, persistence and the legacy-content flag.
// Ported from cases F14-F17 of the patent study's functional suite.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import collabModule from '../../collaborationServer.js';
import { Y, authed, connectReplica, createTestApp, freePort, signup, startDatabase, waitFor } from '../helpers.mjs';

let stopDatabase;
let app;
let collab;
let url;
let owner;

const createDocument = async (body) => (await authed(app, owner.token).post('/api/documents', body)).body._id;

beforeAll(async () => {
    stopDatabase = await startDatabase();
    app = createTestApp();
    const port = await freePort();
    collab = collabModule.createCollaborationServer({ port, address: '127.0.0.1' });
    await collab.listen();
    url = `ws://127.0.0.1:${port}`;
    owner = await signup(app, 'collab-owner');
});

afterAll(async () => {
    await collab.destroy();
    await stopDatabase();
});

describe('session admission', () => {
    it('refuses an unknown workspace id (F14)', async () => {
        await expect(connectReplica(url, '64b7f0000000000000000000')).rejects.toThrow(/not admitted/);
    });

    it('refuses a workspace flagged private (F15)', async () => {
        const id = await createDocument({ title: 'secret', type: 'text', shareAccess: 'private' });
        await expect(connectReplica(url, id)).rejects.toThrow(/not admitted/);
    });

    it('admits a link-shared workspace (F16)', async () => {
        const id = await createDocument({ title: 'board', type: 'whiteboard', shareAccess: 'link' });
        const replica = await connectReplica(url, id);
        replica.provider.destroy();
    });
});

describe('live synchronisation and persistence', () => {
    it('propagates edits between replicas and converges under concurrent edits', async () => {
        const id = await createDocument({ title: 'pair', type: 'code', shareAccess: 'link' });
        const a = await connectReplica(url, id);
        const b = await connectReplica(url, id);

        a.doc.getText('t').insert(0, 'hello ');
        expect(await waitFor(() => b.doc.getText('t').toString() === 'hello ')).toBe(true);

        for (let i = 0; i < 50; i += 1) {
            a.doc.getText('t').insert(0, 'a');
            b.doc.getText('t').insert(b.doc.getText('t').length, 'b');
        }
        const converged = await waitFor(() => a.doc.getText('t').toString() === b.doc.getText('t').toString());
        expect(converged).toBe(true);
        expect(a.doc.getText('t').length).toBe(106);

        a.provider.destroy();
        b.provider.destroy();
    });

    it('persists state so a fresh replica loads identical content', async () => {
        const id = await createDocument({ title: 'persist', type: 'text', shareAccess: 'link' });
        const writer = await connectReplica(url, id);
        writer.doc.getText('t').insert(0, 'stored content');
        await new Promise((r) => setTimeout(r, 200));
        writer.provider.destroy();

        // The server stores immediately when the last client leaves.
        const loaded = await waitFor(async () => {
            const reader = await connectReplica(url, id);
            const ok = reader.doc.getText('t').toString() === 'stored content';
            reader.provider.destroy();
            return ok;
        }, 8000);
        expect(loaded).toBe(true);
    });

    it('reports legacy content until CRDT state exists, then stops (F17)', async () => {
        const id = await createDocument({
            title: 'legacy',
            type: 'code',
            content: 'console.log(1)\n',
            language: 'javascript'
        });

        const before = await request(app).get(`/api/public/code/${id}`);
        expect(before.body.hasCollaborationState).toBe(false);
        expect(before.body.legacyContent).toBe('console.log(1)\n');

        const client = await connectReplica(url, id);
        client.doc.getMap('contents').set('file-1', new Y.Text(before.body.legacyContent));
        await new Promise((r) => setTimeout(r, 200));
        client.provider.destroy();

        const flipped = await waitFor(
            async () => (await request(app).get(`/api/public/code/${id}`)).body.hasCollaborationState === true,
            8000
        );
        expect(flipped).toBe(true);
        expect((await request(app).get(`/api/public/code/${id}`)).body.legacyContent).toBe('');
    });
});
