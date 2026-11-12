import { describe, expect, it } from 'vitest';
import roomWorkspace from '../../utils/roomWorkspace.js';

const { ROOM_DOCUMENT_TYPE_MAP, buildJoinPath, isWorkspaceRoom, normalizeId, serializeRoomResponse } = roomWorkspace;

describe('normalizeId', () => {
    it('handles null, strings, ObjectId-like values and populated documents', () => {
        expect(normalizeId(null)).toBeNull();
        expect(normalizeId('abc')).toBe('abc');
        expect(normalizeId({ toString: () => 'oid-1' })).toBe('oid-1');
        expect(normalizeId({ _id: { toString: () => 'oid-2' }, name: 'Populated' })).toBe('oid-2');
    });
});

describe('room type mapping', () => {
    it('maps workspace rooms to document types', () => {
        expect(ROOM_DOCUMENT_TYPE_MAP).toEqual({ document: 'text', code: 'code', whiteboard: 'whiteboard' });
    });

    it('treats video rooms as non-workspace rooms', () => {
        expect(isWorkspaceRoom({ type: 'video' })).toBe(false);
        expect(isWorkspaceRoom({ type: 'code' })).toBe(true);
    });
});

describe('buildJoinPath', () => {
    it('routes video rooms by room id', () => {
        expect(buildJoinPath({ _id: 'room1', type: 'video' })).toBe('/video/room1');
    });

    it('routes workspace rooms by document id', () => {
        expect(buildJoinPath({ _id: 'room1', type: 'document', documentId: 'doc1' })).toBe('/document/doc1');
        expect(buildJoinPath({ _id: 'room1', type: 'code', documentId: 'doc2' })).toBe('/code/doc2');
        expect(buildJoinPath({ _id: 'room1', type: 'whiteboard', documentId: 'doc3' })).toBe('/whiteboard/doc3');
    });

    it('returns null when a workspace room has no linked document', () => {
        expect(buildJoinPath({ _id: 'room1', type: 'code', documentId: null })).toBeNull();
        expect(buildJoinPath(null)).toBeNull();
    });
});

describe('serializeRoomResponse', () => {
    it('adds a string documentId and join path', () => {
        const room = { _id: 'room1', type: 'code', documentId: { toString: () => 'doc9' }, name: 'Pairing' };
        expect(serializeRoomResponse(room)).toMatchObject({
            name: 'Pairing',
            documentId: 'doc9',
            joinPath: '/code/doc9'
        });
    });
});
