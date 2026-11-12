import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import {
  clampPoint,
  createStrokeId,
  getStrokeComposite,
  normalizePoint,
  readWhiteboardStrokes,
  toCanvasPoint
} from './whiteboardCollaboration'

describe('normalizePoint', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 }

  it('maps client coordinates into the unit square', () => {
    expect(normalizePoint(300, 150, rect)).toEqual({ x: 0.5, y: 0.5 })
    expect(normalizePoint(100, 50, rect)).toEqual({ x: 0, y: 0 })
  })

  it('clamps points outside the surface', () => {
    expect(normalizePoint(0, 1000, rect)).toEqual({ x: 0, y: 1 })
  })

  it('does not divide by zero for an empty surface', () => {
    const point = normalizePoint(10, 10, { left: 0, top: 0, width: 0, height: 0 })
    expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true)
  })
})

describe('toCanvasPoint', () => {
  it('scales a normalised point to any canvas size', () => {
    expect(toCanvasPoint({ x: 0.25, y: 0.5 }, { width: 800, height: 600 })).toEqual({ x: 200, y: 300 })
    expect(toCanvasPoint({ x: 0.25, y: 0.5 }, { width: 400, height: 300 })).toEqual({ x: 100, y: 150 })
  })
})

describe('helpers', () => {
  it('clamps values to [0, 1]', () => {
    expect(clampPoint(-1)).toBe(0)
    expect(clampPoint(0.3)).toBe(0.3)
    expect(clampPoint(7)).toBe(1)
  })

  it('erases with destination-out compositing', () => {
    expect(getStrokeComposite('eraser')).toBe('destination-out')
    expect(getStrokeComposite('pen')).toBe('source-over')
  })

  it('creates distinct stroke ids', () => {
    const ids = new Set(Array.from({ length: 200 }, createStrokeId))
    expect(ids.size).toBe(200)
  })

  it('reads committed strokes from the shared array', () => {
    const ydoc = new Y.Doc()
    ydoc.getArray('strokes').push([{ id: 's1', points: [] }])
    expect(readWhiteboardStrokes(ydoc)).toEqual([{ id: 's1', points: [] }])
  })
})
