import { describe, expect, it } from 'vitest';
import configModule from '../../config.js';

const { loadConfig } = configModule;

describe('loadConfig', () => {
    it('applies defaults when only the secret is provided', () => {
        const config = loadConfig({ JWT_SECRET: 'x'.repeat(32) });
        expect(config.PORT).toBe(5000);
        expect(config.COLLAB_PORT).toBe(1234);
        expect(config.CLIENT_URL).toBe('http://localhost:3000');
        expect(config.allowedOrigins).toEqual(['http://localhost:3000']);
    });

    it('rejects a missing JWT secret', () => {
        expect(() => loadConfig({})).toThrow(/JWT_SECRET/);
    });

    it('rejects a JWT secret shorter than 16 characters', () => {
        expect(() => loadConfig({ JWT_SECRET: 'short' })).toThrow(/at least 16 characters/);
    });

    it('rejects a malformed client URL', () => {
        expect(() => loadConfig({ JWT_SECRET: 'x'.repeat(32), CLIENT_URL: 'not a url' })).toThrow(/CLIENT_URL/);
    });

    it('coerces numeric ports and dedupes allowed origins', () => {
        const config = loadConfig({ JWT_SECRET: 'x'.repeat(32), PORT: '5050', CLIENT_URL: 'http://localhost:3100' });
        expect(config.PORT).toBe(5050);
        expect(config.allowedOrigins).toEqual(['http://localhost:3100', 'http://localhost:3000']);
    });

    it('treats empty optional OAuth values as unset', () => {
        const config = loadConfig({ JWT_SECRET: 'x'.repeat(32), GOOGLE_CLIENT_ID: '' });
        expect(config.GOOGLE_CLIENT_ID).toBeUndefined();
    });
});
