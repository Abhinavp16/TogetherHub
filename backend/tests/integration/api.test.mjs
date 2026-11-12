// REST API behaviour: auth, rooms, workspace binding, teams, access rules and dashboard.
// Ported from the functional validation suite used in the patent study (cases F01-F13, F18).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { authed, createTestApp, signup, startDatabase } from '../helpers.mjs';

let stopDatabase;
let app;
const documents = () => mongoose.connection.db.collection('documents');
const oid = (id) => new mongoose.Types.ObjectId(id);

beforeAll(async () => {
    stopDatabase = await startDatabase();
    app = createTestApp();
});

afterAll(async () => {
    await stopDatabase();
});

describe('authentication', () => {
    it('signs up a user and returns a token and profile (F01)', async () => {
        const { res, token } = await signup(app, 'alice');
        expect(res.status).toBe(201);
        expect(token).toBeTruthy();
        expect(res.body.user).toMatchObject({ name: 'alice', provider: 'local' });
        expect(res.body.user.password).toBeUndefined();
    });

    it('rejects a duplicate email', async () => {
        const { email } = await signup(app, 'dup');
        const res = await request(app).post('/api/auth/signup').send({ name: 'dup', email, password: 'another-pass' });
        expect(res.status).toBe(400);
    });

    it('accepts valid credentials and rejects invalid ones (F02)', async () => {
        const { email } = await signup(app, 'bob');
        const good = await request(app).post('/api/auth/login').send({ email, password: 'test-password' });
        const bad = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
        expect(good.status).toBe(200);
        expect(bad.status).toBe(401);
    });

    it('normalises email case on login', async () => {
        const { email } = await signup(app, 'case');
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: email.toUpperCase(), password: 'test-password' });
        expect(res.status).toBe(200);
    });

    it('requires a valid token for protected routes (F03)', async () => {
        const { token } = await signup(app, 'carol');
        expect((await authed(app, token).get('/api/auth/me')).status).toBe(200);
        expect((await request(app).get('/api/auth/me')).status).toBe(401);
        expect((await authed(app, 'not-a-token').get('/api/auth/me')).status).toBe(401);
    });
});

describe('room-workspace binding', () => {
    let owner;

    beforeAll(async () => {
        owner = await signup(app, 'owner');
    });

    it.each([
        ['document', 'document', 'text'],
        ['code', 'code', 'code'],
        ['whiteboard', 'whiteboard', 'whiteboard']
    ])('creating a %s room provisions a typed workspace and join path (F04)', async (type, segment, docType) => {
        const res = await authed(app, owner.token).post('/api/rooms', { name: `${type} room`, type });
        expect(res.status).toBe(201);
        expect(res.body.joinPath).toBe(`/${segment}/${res.body.documentId}`);
        const doc = await documents().findOne({ _id: oid(res.body.documentId) });
        expect(doc.type).toBe(docType);
        expect(doc.title).toBe(`${type} room`);
    });

    it('routes video rooms to the room itself with no workspace (F05)', async () => {
        const res = await authed(app, owner.token).post('/api/rooms', { name: 'standup', type: 'video' });
        expect(res.body.joinPath).toBe(`/video/${res.body._id}`);
        expect(res.body.documentId).toBeNull();
    });

    it('defaults code workspaces to JavaScript (F06)', async () => {
        const res = await authed(app, owner.token).post('/api/rooms', { name: 'code', type: 'code' });
        const doc = await documents().findOne({ _id: oid(res.body.documentId) });
        expect(doc.language).toBe('javascript');
    });

    it('re-provisions a workspace that was deleted from the store (F07)', async () => {
        const created = await authed(app, owner.token).post('/api/rooms', { name: 'heal me', type: 'document' });
        await documents().deleteOne({ _id: oid(created.body.documentId) });

        const healed = await authed(app, owner.token).get(`/api/rooms/${created.body._id}`);
        expect(healed.body.documentId).toBeTruthy();
        expect(healed.body.documentId).not.toBe(created.body.documentId);
        expect(healed.body.joinPath).toBe(`/document/${healed.body.documentId}`);
        expect(await documents().findOne({ _id: oid(healed.body.documentId) })).not.toBeNull();
    });

    it('syncs room membership into workspace collaborators on join and leave (F08, F09)', async () => {
        const member = await signup(app, 'member');
        const room = await authed(app, owner.token).post('/api/rooms', { name: 'pairing', type: 'code' });

        expect((await authed(app, member.token).post(`/api/rooms/${room.body._id}/join`)).status).toBe(200);
        let doc = await documents().findOne({ _id: oid(room.body.documentId) });
        expect(doc.collaborators.map(String)).toContain(String(member.id));

        await authed(app, member.token).post(`/api/rooms/${room.body._id}/leave`);
        doc = await documents().findOne({ _id: oid(room.body.documentId) });
        expect(doc.collaborators.map(String)).not.toContain(String(member.id));
    });
});

describe('teams and private rooms', () => {
    let owner;
    let member;
    let outsider;
    let team;
    let privateRoom;

    beforeAll(async () => {
        owner = await signup(app, 'team-owner');
        member = await signup(app, 'team-member');
        outsider = await signup(app, 'outsider');
        team = (await authed(app, owner.token).post('/api/teams', { name: 'Validation Team' })).body;
    });

    it('lets the team owner add a registered user with a role (F10)', async () => {
        const res = await authed(app, owner.token).post(`/api/teams/${team._id}/members`, {
            email: member.email,
            role: 'editor'
        });
        expect(res.status).toBe(200);
        expect(res.body.members.find((m) => m.email === member.email).role).toBe('editor');
    });

    it('does not let a non-manager add members', async () => {
        const res = await authed(app, member.token).post(`/api/teams/${team._id}/members`, { email: outsider.email });
        expect(res.status).toBe(403);
    });

    it('turns team members into room invitations (F11)', async () => {
        const res = await authed(app, owner.token).post('/api/rooms', {
            name: 'team room',
            type: 'document',
            isPrivate: true,
            teamId: team._id
        });
        privateRoom = res.body;
        expect(privateRoom.invites).toContain(member.email);
        expect(privateRoom.invites).not.toContain(owner.email);
    });

    it('shows a private room to invitees and hides it from others (F12)', async () => {
        expect((await authed(app, member.token).get(`/api/rooms/${privateRoom._id}`)).status).toBe(200);
        expect((await authed(app, outsider.token).get(`/api/rooms/${privateRoom._id}`)).status).toBe(403);

        const outsiderRooms = (await authed(app, outsider.token).get('/api/rooms')).body;
        expect(outsiderRooms.map((r) => r._id)).not.toContain(privateRoom._id);
    });

    it("gives a private room's workspace no link access (F13)", async () => {
        const doc = await documents().findOne({ _id: oid(privateRoom.documentId) });
        expect(doc.linkAccess).toBe('none');
    });

    it('consumes the invitation when the invitee joins', async () => {
        const joined = await authed(app, member.token).post(`/api/rooms/${privateRoom._id}/join`);
        expect(joined.status).toBe(200);
        expect(joined.body.invites).not.toContain(member.email);
    });

    it('aggregates the dashboard summary for the user (F18)', async () => {
        const res = await authed(app, owner.token).get('/api/dashboard/summary');
        expect(res.status).toBe(200);
        expect(res.body.stats.teamCount).toBe(1);
        expect(res.body.stats.workspaceCount).toBeGreaterThan(0);
        expect(res.body.recentRooms.length).toBeGreaterThan(0);
    });
});
