export const whiteboardColors = [
  '#111827',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#a855f7',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#64748b'
]

export const createStrokeId = () => `stroke-${Math.random().toString(36).slice(2, 10)}`

export const clampPoint = (value) => {
  return Math.max(0, Math.min(1, value))
}

export const normalizePoint = (clientX, clientY, rect) => {
  const width = rect.width || 1
  const height = rect.height || 1

  return {
    x: clampPoint((clientX - rect.left) / width),
    y: clampPoint((clientY - rect.top) / height)
  }
}

export const toCanvasPoint = (point, canvas) => {
  return {
    x: point.x * canvas.width,
    y: point.y * canvas.height
  }
}

export const getStrokeComposite = (tool) => {
  return tool === 'eraser' ? 'destination-out' : 'source-over'
}

export const drawStroke = (ctx, stroke, canvas) => {
  if (!stroke?.points?.length) {
    return
  }

  const width = Number(stroke.width) || 2
  const color = stroke.color || '#111827'
  const points = stroke.points.map((point) => toCanvasPoint(point, canvas))

  ctx.save()
  ctx.globalCompositeOperation = getStrokeComposite(stroke.tool)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = width

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  if (points.length === 1) {
    ctx.lineTo(points[0].x + 0.01, points[0].y + 0.01)
  } else {
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y)
    }
  }

  ctx.stroke()
  ctx.restore()
}

export const drawCursor = (ctx, cursor, canvas, color, name) => {
  if (!cursor) {
    return
  }

  const point = toCanvasPoint(cursor, canvas)

  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
  ctx.fill()

  if (name) {
    ctx.font = '12px "Plus Jakarta Sans", sans-serif'
    const label = name.length > 18 ? `${name.slice(0, 18)}…` : name
    const metrics = ctx.measureText(label)
    const paddingX = 8
    const paddingY = 6
    const labelX = Math.min(point.x + 10, canvas.width - metrics.width - paddingX * 2 - 8)
    const labelY = Math.max(point.y - 28, 18)

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, metrics.width + paddingX * 2, 24, 12)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, labelX + paddingX, labelY + 15)
  }

  ctx.restore()
}

export const readWhiteboardStrokes = (ydoc) => {
  return ydoc.getArray('strokes').toArray()
}
