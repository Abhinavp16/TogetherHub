// Regression tests for the security and access-control bugs found in the October 2026 bug hunt.
// Each test reproduces the original attack and asserts it is now blocked.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import meeting from '../../sockets/meeting.js';
import { authed, createTestApp, freePort, signup, startDatabase } from '../helpers.mjs';


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

describe('workspace access control', () => {
    it('blocks a room member from taking ownership of the workspace (bug 1)', async () => {
        const owner = await signup(app, 'owner');
        const attacker = await signup(app, 'attacker');
        const room = (await authed(app, owner.token).post('/api/rooms', { name: 'public', type: 'code' })).body;
        await authed(app, attacker.token).post(`/api/rooms/${room._id}/join`);

        const put = await authed(app, attacker.token).put(`/api/documents/${room.documentId}`, {
            owner: attacker.id,
            collaborators: [],
            title: 'still editable'
        });
        expect(put.status).toBe(200);

        const doc = await documents().findOne({ _id: oid(room.documentId) });
        expect(String(doc.owner)).toBe(String(owner.id));
        expect(doc.collaborators.map(String)).toContain(String(attacker.id));
        expect(doc.title).toBe('still editable');
        expect((await authed(app, attacker.token).delete(`/api/documents/${room.documentId}`)).status).toBe(404);
    });

    it('stops non-owners from changing link access', async () => {
        const owner = await signup(app, 'owner');
        const member = await signup(app, 'member');
        const room = (await authed(app, owner.token).post('/api/rooms', { name: 'r', type: 'document' })).body;
        await authed(app, member.token).post(`/api/rooms/${room._id}/join`);

        const res = await authed(app, member.token).put(`/api/documents/${room.documentId}`, { linkAccess: 'none' });
        expect(res.status).toBe(403);
    });

    it('refuses anonymous changes to link access and anonymous edits to view-only links (bug 2)', async () => {
        const owner = await signup(app, 'victim');
        const id = (await authed(app, owner.token).post('/api/documents', { title: 'Mine', type: 'text' })).body._id;

        const lockout = await request(app).patch(`/api/public/documents/${id}`).send({ linkAccess: 'none' });
        expect(lockout.status).toBe(403);
        expect((await request(app).get(`/api/public/documents/${id}`)).status).toBe(200);

        await authed(app, owner.token).patch(`/api/public/documents/${id}`, { linkAccess: 'view' });
        const rename = await request(app).patch(`/api/public/documents/${id}`).send({ title: 'hacked' });
        expect(rename.status).toBe(403);
        const meta = await request(app).get(`/api/public/documents/${id}`);
        expect(meta.body).toMatchObject({ title: 'Mine', role: 'viewer', linkAccess: 'view' });
    });

    it('lets the owner turn off link access so guests can no longer open the workspace', async () => {
        const owner = await signup(app, 'owner');
        const id = (await authed(app, owner.token).post('/api/documents', { title: 'x', type: 'code' })).body._id;
        await authed(app, owner.token).patch(`/api/public/code/${id}`, { linkAccess: 'none' });

        expect((await request(app).get(`/api/public/code/${id}`)).status).toBe(404);
        expect((await authed(app, owner.token).get(`/api/public/code/${id}`)).body.role).toBe('owner');
    });

    it('lets owners and members open a private room workspace, but not outsiders (bug 10)', async () => {
        const owner = await signup(app, 'owner');
        const member = await signup(app, 'member');
        const outsider = await signup(app, 'outsider');
        const room = (
            await authed(app, owner.token).post('/api/rooms', {
                name: 'secret',
                type: 'whiteboard',
                isPrivate: true,
                invites: [member.email]
            })
        ).body;
        await authed(app, member.token).post(`/api/rooms/${room._id}/join`);

        expect((await authed(app, owner.token).get(`/api/public/whiteboards/${room.documentId}`)).body.role).toBe(
            'owner'
        );
        expect((await authed(app, member.token).get(`/api/public/whiteboards/${room.documentId}`)).body.role).toBe(
            'editor'
        );
        expect((await authed(app, outsider.token).get(`/api/public/whiteboards/${room.documentId}`)).status).toBe(404);
        expect((await request(app).get(`/api/public/whiteboards/${room.documentId}`)).status).toBe(404);
    });

    it('ignores ownership fields when creating a workspace', async () => {
        const user = await signup(app, 'creator');
        const other = await signup(app, 'other');
        const res = await authed(app, user.token).post('/api/documents', {
            title: 'mine',
            type: 'text',
            owner: other.id,
            collaborators: [other.id],
            yjsState: 'AAAA'
        });
        const doc = await documents().findOne({ _id: oid(res.body._id) });
        expect(String(doc.owner)).toBe(String(user.id));
        expect(doc.collaborators).toHaveLength(0);
        expect(doc.yjsState).toBeNull();
    });
});

describe('user data exposure', () => {
    it('never returns the password hash from profile endpoints (bug 3)', async () => {
        const u = await signup(app, 'profile');
        const profile = await authed(app, u.token).get('/api/users/profile');
        expect(profile.body.password).toBeUndefined();
        expect(profile.body.email).toBe(u.email);

        const updated = await authed(app, u.token).put('/api/users/profile', { name: 'Renamed' });
        expect(updated.body.password).toBeUndefined();
        expect(updated.body.name).toBe('Renamed');
    });

    it('no longer lists every user; exact lookup only, without the email (bug 4)', async () => {
        const target = await signup(app, 'target');
        const stranger = await signup(app, 'stranger');
        expect((await authed(app, stranger.token).get('/api/users')).status).toBe(404);

        const found = await authed(app, stranger.token).get(
            `/api/users/lookup?email=${encodeURIComponent(target.email)}`
        );
        expect(found.body).toEqual({ id: String(target.id), name: 'target', avatar: expect.any(String) });
        expect((await authed(app, stranger.token).get('/api/users/lookup?email=nobody@x.test')).status).toBe(404);
    });
});

describe('team roles', () => {
    let owner;
    let admin;
    let editor;
    let team;

    beforeAll(async () => {
        owner = await signup(app, 'teamowner');
        admin = await signup(app, 'teamadmin');
        editor = await signup(app, 'teameditor');
        team = (await authed(app, owner.token).post('/api/teams', { name: 'T' })).body;
        await authed(app, owner.token).post(`/api/teams/${team._id}/members`, { email: admin.email, role: 'admin' });
        await authed(app, owner.token).post(`/api/teams/${team._id}/members`, { email: editor.email, role: 'editor' });
    });

    it('does not let an admin promote themselves to owner (bug 7)', async () => {
        const res = await authed(app, admin.token).patch(`/api/teams/${team._id}/members/${admin.id}`, {
            role: 'owner'
        });
        expect(res.status).toBe(400);
    });

    it('does not let anyone grant the owner role', async () => {
        const res = await authed(app, owner.token).patch(`/api/teams/${team._id}/members/${editor.id}`, {
            role: 'owner'
        });
        expect(res.status).toBe(400);
    });

    it('does not let an admin grant admin', async () => {
        const res = await authed(app, admin.token).patch(`/api/teams/${team._id}/members/${editor.id}`, {
            role: 'admin'
        });
        expect(res.status).toBe(403);
    });

    it('still lets an admin manage editors and viewers', async () => {
        const res = await authed(app, admin.token).patch(`/api/teams/${team._id}/members/${editor.id}`, {
            role: 'viewer'
        });
        expect(res.status).toBe(200);
    });

    it('lets only the owner remove an admin', async () => {
        const other = await signup(app, 'otheradmin');
        await authed(app, owner.token).post(`/api/teams/${team._id}/members`, { email: other.email, role: 'admin' });
        expect((await authed(app, admin.token).delete(`/api/teams/${team._id}/members/${other.id}`)).status).toBe(403);
        expect((await authed(app, owner.token).delete(`/api/teams/${team._id}/members/${other.id}`)).status).toBe(200);
    });
});

describe('authentication', () => {
    it('issues tokens that expire (bug 8)', async () => {
        const u = await signup(app, 'token');
        const { exp, iat } = jwt.decode(u.token);
        expect(exp - iat).toBe(7 * 24 * 60 * 60);
    });

    it('rejects an expired token', async () => {
        const u = await signup(app, 'expired');
        const expired = jwt.sign({ _id: String(u.id) }, process.env.JWT_SECRET, { expiresIn: -10 });
        expect((await authed(app, expired).get('/api/auth/me')).status).toBe(401);
    });

    it('adds and verifies an OAuth state parameter (bug 9)', async () => {
        process.env.GOOGLE_CLIENT_ID = 'cid';
        process.env.GOOGLE_CLIENT_SECRET = 'secret';
        process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';

        const start = await request(app).get('/api/auth/google/start');
        const state = new URL(start.headers.location).searchParams.get('state');
        expect(state).toMatch(/^[a-f0-9]{48}$/);
        expect(start.headers['set-cookie'].join(';')).toMatch(/oauth_state=.*HttpOnly/);

        // A forged callback without the matching cookie is rejected before the code is exchanged.
        const forged = await request(app).get(`/api/auth/google/callback?code=attacker-code&state=${state}`);
        expect(forged.headers.location).toMatch(/error=Sign-in(%20|\+)could(%20|\+)not(%20|\+)be(%20|\+)verified/);
    });

    it('validates sign-up input (bug 23)', async () => {
        const post = (body) => request(app).post('/api/auth/signup').send(body);
        expect((await post({ name: 'x', email: 'abhinav16', password: 'long-enough' })).status).toBe(400);
        expect((await post({ name: 'x', email: 'a@b.co', password: 'short' })).status).toBe(400);
        expect((await post({ name: '  ', email: 'a@b.co', password: 'long-enough' })).status).toBe(400);
        expect((await post({ name: 'Ok', email: `ok-${Date.now()}@b.co`, password: 'long-enough' })).status).toBe(201);
    });
});

describe('robustness', () => {
    it('returns 404 for malformed ids instead of 500 (bug 22)', async () => {
        const u = await signup(app, 'badid');
        expect((await authed(app, u.token).get('/api/rooms/not-an-id')).status).toBe(404);
        expect((await authed(app, u.token).get('/api/documents/123')).status).toBe(404);
        expect((await authed(app, u.token).get('/api/teams/zzz')).status).toBe(404);
        expect((await request(app).get('/api/public/documents/1')).status).toBe(404);
    });

    it('does not create duplicate workspaces under concurrent requests (bug 21)', async () => {
        const owner = await signup(app, 'racer');
        const room = (await authed(app, owner.token).post('/api/rooms', { name: 'race', type: 'whiteboard' })).body;
        await mongoose.connection.db
            .collection('rooms')
            .updateOne({ _id: oid(room._id) }, { $set: { documentId: null } });
        const before = await documents().countDocuments({ title: 'race' });

        const responses = await Promise.all(
            Array.from({ length: 8 }, () => authed(app, owner.token).get(`/api/rooms/${room._id}`))
        );
        const created = (await documents().countDocuments({ title: 'race' })) - before;
        expect(created).toBe(1);
        expect(new Set(responses.map((r) => r.body.documentId)).size).toBe(1);
    });

    it('keeps a renamed workspace title after the rooms list is refreshed (bug 11)', async () => {
        const owner = await signup(app, 'renamer');
        const room = (await authed(app, owner.token).post('/api/rooms', { name: 'Room name', type: 'document' })).body;
        await authed(app, owner.token).patch(`/api/public/documents/${room.documentId}`, { title: 'My better title' });
        await authed(app, owner.token).get('/api/rooms');
        expect((await documents().findOne({ _id: oid(room.documentId) })).title).toBe('My better title');
    });

    it('stops the owner leaving their own room and non-members leaving', async () => {
        const owner = await signup(app, 'leaver');
        const stranger = await signup(app, 'stranger');
        const room = (await authed(app, owner.token).post('/api/rooms', { name: 'r', type: 'document' })).body;
        expect((await authed(app, owner.token).post(`/api/rooms/${room._id}/leave`)).status).toBe(400);
        expect((await authed(app, stranger.token).post(`/api/rooms/${room._id}/leave`)).status).toBe(400);
    });
});

describe('meeting sockets (bug 6)', () => {
    let server;
    let io;
    let url;
    const clients = [];

    const connect = (token) =>
        new Promise((resolve) => {
            const socket = ioClient(url, { transports: ['websocket'], auth: { token }, reconnection: false });
            clients.push(socket);
            socket.on('connect', () => resolve({ socket, ok: true }));
            socket.on('connect_error', (error) => resolve({ socket, ok: false, error: error.message }));
        });

    const join = (socket, roomId) =>
        new Promise((resolve) => {
            socket.once('meeting-room-joined', () => resolve('joined'));
            socket.once('meeting-error', (e) => resolve(e.message));
            socket.emit('meeting-join-room', { roomId });
        });

    beforeAll(async () => {
        server = http.createServer();
        io = new Server(server);
        meeting.registerMeetingHandlers(io);
        const port = await freePort();
        await new Promise((r) => server.listen(port, r));
        url = `http://localhost:${port}`;
    });

    afterAll(async () => {
        clients.forEach((c) => c.close());
        io.close();
    });

    it('refuses connections without a valid token', async () => {
        expect((await connect(undefined)).ok).toBe(false);
        expect((await connect('garbage')).ok).toBe(false);
    });

    it('refuses to join a private meeting the user cannot access', async () => {
        const owner = await signup(app, 'host');
        const outsider = await signup(app, 'outsider');
        const room = (await authed(app, owner.token).post('/api/rooms', { name: 'm', type: 'video', isPrivate: true }))
            .body;
        const { socket } = await connect(outsider.token);
        expect(await join(socket, room._id)).toMatch(/access/);
    });

    it('drops chat from sockets outside the meeting and uses the real sender name', async () => {
        const host = await signup(app, 'Host');
        const intruder = await signup(app, 'Intruder');
        const room = (await authed(app, host.token).post('/api/rooms', { name: 'm', type: 'video' })).body;

        const { socket: hostSocket } = await connect(host.token);
        expect(await join(hostSocket, room._id)).toBe('joined');
        const messages = [];
        hostSocket.on('meeting-chat-message', (m) => messages.push(m));

        const { socket: intruderSocket } = await connect(intruder.token);
        intruderSocket.emit('meeting-chat-message', { roomId: room._id, message: 'fake', sender: { name: 'Admin' } });

        hostSocket.emit('meeting-chat-message', { roomId: room._id, message: 'hello', sender: { name: 'Admin' } });
        await new Promise((r) => setTimeout(r, 300));

        expect(messages).toHaveLength(1);
        expect(messages[0]).toMatchObject({ message: 'hello', sender: { name: 'Host' } });
    });
});
