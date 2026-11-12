import net from 'node:net';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import appModule from '../app.js';

export { Y };

export const startDatabase = async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    return async () => {
        await mongoose.disconnect();
        await mongod.stop();
    };
};

export const createTestApp = () => appModule.createApp();

export const freePort = () =>
    new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on('error', reject);
    });

let userCounter = 0;

export const signup = async (app, name = 'user') => {
    userCounter += 1;
    const email = `${name}-${userCounter}-${Date.now()}@togetherhub.test`;
    const res = await request(app).post('/api/auth/signup').send({ name, email, password: 'test-password' });
    return { res, email, token: res.body.token, id: res.body.user?.id };
};

export const authed = (app, token) => ({
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
    put: (url, body) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
    patch: (url, body) => request(app).patch(url).set('Authorization', `Bearer ${token}`).send(body),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
});

// Opens a collaboration session; resolves with the synced replica or rejects if the server refuses.
export const connectReplica = (url, name, { timeoutMs = 4000, doc = new Y.Doc(), token = 'guest' } = {}) =>
    new Promise((resolve, reject) => {
        const provider = new HocuspocusProvider({
            url,
            name,
            document: doc,
            token,
            onSynced: () => {
                clearTimeout(timer);
                resolve({ doc, provider });
            }
        });
        const timer = setTimeout(() => {
            provider.destroy();
            reject(new Error(`session for ${name} was not admitted`));
        }, timeoutMs);
    });

export const waitFor = async (predicate, timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (await predicate()) return true;
        await new Promise((r) => setTimeout(r, 20));
    }
    return false;
};
