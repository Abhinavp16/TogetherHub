import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import {
  bootstrapCodeWorkspace,
  getDefaultFileName,
  getDescendantNodeIds,
  getNextSiblingOrder,
  getWorkspaceMaps,
  inferLanguageFromFileName,
  readWorkspaceSnapshot
} from './codeWorkspace'

const addNode = (ydoc, node, content) => {
  const { nodes, contents } = getWorkspaceMaps(ydoc)
  nodes.set(node.id, node)
  if (node.kind === 'file') {
    contents.set(node.id, new Y.Text(content ?? ''))
  }
}

describe('inferLanguageFromFileName', () => {
  it('maps known extensions and falls back otherwise', () => {
    expect(inferLanguageFromFileName('app.py')).toBe('python')
    expect(inferLanguageFromFileName('Main.JAVA')).toBe('java')
    expect(inferLanguageFromFileName('notes.md')).toBe('markdown')
    expect(inferLanguageFromFileName('Makefile', 'go')).toBe('go')
    expect(inferLanguageFromFileName('archive.zip', 'rust')).toBe('rust')
  })
})

describe('getDefaultFileName', () => {
  it('derives the file name from the language', () => {
    expect(getDefaultFileName('python')).toBe('main.py')
    expect(getDefaultFileName('markdown')).toBe('README.md')
    expect(getDefaultFileName('unknown')).toBe('main.txt')
  })
})

describe('bootstrapCodeWorkspace', () => {
  it('creates one default file with the given content', () => {
    const ydoc = new Y.Doc()
    const fileId = bootstrapCodeWorkspace(ydoc, { content: 'print(1)\n', language: 'python' })
    const snapshot = readWorkspaceSnapshot(ydoc)
    expect(snapshot.files).toHaveLength(1)
    expect(snapshot.files[0]).toMatchObject({ id: fileId, name: 'main.py', language: 'python' })
    expect(snapshot.fileContents[fileId]).toBe('print(1)\n')
  })

  it('does nothing when the workspace already has nodes', () => {
    const ydoc = new Y.Doc()
    bootstrapCodeWorkspace(ydoc, { content: 'first' })
    expect(bootstrapCodeWorkspace(ydoc, { content: 'second' })).toBeNull()
    expect(readWorkspaceSnapshot(ydoc).files).toHaveLength(1)
  })
})

describe('readWorkspaceSnapshot', () => {
  it('builds the tree with folders first, then order, then name', () => {
    const ydoc = new Y.Doc()
    addNode(ydoc, { id: 'f-b', kind: 'file', name: 'b.js', parentId: null, order: 0 })
    addNode(ydoc, { id: 'f-a', kind: 'file', name: 'a.js', parentId: null, order: 0 })
    addNode(ydoc, { id: 'd-src', kind: 'folder', name: 'src', parentId: null, order: 5 })
    addNode(ydoc, { id: 'f-late', kind: 'file', name: 'aa.js', parentId: null, order: 1 })
    addNode(ydoc, { id: 'f-inner', kind: 'file', name: 'inner.ts', parentId: 'd-src', order: 0 })

    const { tree, files } = readWorkspaceSnapshot(ydoc)
    expect(tree.map((n) => n.id)).toEqual(['d-src', 'f-a', 'f-b', 'f-late'])
    expect(tree[0].children.map((n) => n.id)).toEqual(['f-inner'])
    expect(files.find((f) => f.id === 'f-inner').language).toBe('typescript')
  })

  it('produces identical snapshots on two converged replicas', () => {
    const a = new Y.Doc()
    const b = new Y.Doc()
    addNode(a, { id: 'd1', kind: 'folder', name: 'lib', parentId: null, order: 0 })
    addNode(b, { id: 'f1', kind: 'file', name: 'index.js', parentId: null, order: 0 }, 'x')
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    const strip = (snap) => JSON.stringify({ tree: snap.tree, contents: snap.fileContents })
    expect(strip(readWorkspaceSnapshot(a))).toBe(strip(readWorkspaceSnapshot(b)))
  })
})

describe('getDescendantNodeIds', () => {
  it('returns the node and every nested descendant', () => {
    const ydoc = new Y.Doc()
    addNode(ydoc, { id: 'root', kind: 'folder', name: 'root', parentId: null, order: 0 })
    addNode(ydoc, { id: 'child', kind: 'folder', name: 'child', parentId: 'root', order: 0 })
    addNode(ydoc, { id: 'leaf', kind: 'file', name: 'leaf.js', parentId: 'child', order: 0 })
    addNode(ydoc, { id: 'other', kind: 'file', name: 'other.js', parentId: null, order: 1 })
    expect(new Set(getDescendantNodeIds(ydoc, 'root'))).toEqual(new Set(['root', 'child', 'leaf']))
  })
})

describe('getNextSiblingOrder', () => {
  it('returns one more than the largest sibling order', () => {
    const ydoc = new Y.Doc()
    expect(getNextSiblingOrder(ydoc, null)).toBe(0)
    addNode(ydoc, { id: 'a', kind: 'file', name: 'a', parentId: null, order: 3 })
    addNode(ydoc, { id: 'b', kind: 'file', name: 'b', parentId: 'elsewhere', order: 9 })
    expect(getNextSiblingOrder(ydoc, null)).toBe(4)
  })
})
