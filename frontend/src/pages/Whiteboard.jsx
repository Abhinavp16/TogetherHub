import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eraser, Loader2, Palette, Pen, Save, Share, Trash2 } from 'lucide-react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { documentAPI, getCollaborationUrl, publicWhiteboardAPI } from '../services/api'
import {
  clampPoint,
  createStrokeId,
  drawCursor,
  drawStroke,
  getStrokeComposite,
  normalizePoint,
  readWhiteboardStrokes,
  whiteboardColors
} from '../utils/whiteboardCollaboration'

const collaboratorColors = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#059669',
  '#0891b2'
]

const buildGuestProfile = () => {
  const storedName = localStorage.getItem('guestDisplayName')
  const storedColor = localStorage.getItem('guestDisplayColor')

  if (storedName && storedColor) {
    return {
      id: `guest-${storedName.toLowerCase().replace(/\s+/g, '-')}`,
      name: storedName,
      color: storedColor,
      isGuest: true
    }
  }

  const generatedName = `Guest ${Math.floor(1000 + Math.random() * 9000)}`
  const generatedColor = collaboratorColors[Math.floor(Math.random() * collaboratorColors.length)]

  localStorage.setItem('guestDisplayName', generatedName)
  localStorage.setItem('guestDisplayColor', generatedColor)

  return {
    id: `guest-${generatedName.toLowerCase().replace(/\s+/g, '-')}`,
    name: generatedName,
    color: generatedColor,
    isGuest: true
  }
}

const createPresenceProfile = (user) => {
  if (user) {
    const fallbackColor = collaboratorColors[String(user.id || user._id || user.email || user.name).length % collaboratorColors.length]

    return {
      id: user.id || user._id || user.email,
      name: user.name,
      color: fallbackColor,
      avatar: user.avatar || '',
      isGuest: false
    }
  }

  return buildGuestProfile()
}

const extractPresence = (awareness) => {
  if (!awareness) {
    return []
  }

  return Array.from(awareness.getStates().entries())
    .map(([clientId, state]) => {
      if (!state.user) {
        return null
      }

      return {
        clientId,
        ...state.user,
        cursor: state.cursor || null,
        draftStroke: state.draftStroke || null
      }
    })
    .filter(Boolean)
}

const setProviderPresence = (provider, field, value) => {
  if (!provider) {
    return
  }

  provider.setAwarenessField(field, value)
}

const getInitials = (name) => {
  const parts = String(name || '').split(/\s+/).filter(Boolean).slice(0, 2)

  if (parts.length === 0) {
    return '?'
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

const tools = [
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' }
]

const Whiteboard = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const collaborationRef = useRef(null)
  const drawingRef = useRef({
    isDrawing: false,
    points: [],
    lastCanvasPoint: null
  })

  const [loading, setLoading] = useState(true)
  const [documentMeta, setDocumentMeta] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [presenceUsers, setPresenceUsers] = useState([])
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#111827')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [collaborationSession, setCollaborationSession] = useState(null)
  const [boardVersion, setBoardVersion] = useState(0)
  const [awarenessVersion, setAwarenessVersion] = useState(0)
  const [localDraftStroke, setLocalDraftStroke] = useState(null)

  const presenceProfile = useMemo(() => createPresenceProfile(user), [user])

  useEffect(() => {
    if (roomId !== 'new') {
      return undefined
    }

    if (authLoading) {
      return undefined
    }

    if (!user) {
      toast.error('Please log in to create a new whiteboard')
      navigate('/login', { replace: true })
      return undefined
    }

    let cancelled = false

    const createBoard = async () => {
      try {
        const response = await documentAPI.createDocument({
          title: 'Untitled Whiteboard',
          content: '',
          type: 'whiteboard',
          shareAccess: 'link'
        })

        if (!cancelled) {
          navigate(`/whiteboard/${response.data._id}`, { replace: true })
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create whiteboard')
        navigate('/', { replace: true })
      }
    }

    createBoard()

    return () => {
      cancelled = true
    }
  }, [authLoading, navigate, roomId, user])

  useEffect(() => {
    if (!roomId || roomId === 'new') {
      return undefined
    }

    let cancelled = false

    const loadWhiteboard = async () => {
      setLoading(true)

      try {
        const response = await publicWhiteboardAPI.getDocument(roomId)

        if (!cancelled) {
          setDocumentMeta(response.data)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load shared whiteboard')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadWhiteboard()

    return () => {
      cancelled = true
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId || roomId === 'new' || !documentMeta) {
      return undefined
    }

    const ydoc = new Y.Doc()
    let provider

    provider = new HocuspocusProvider({
      url: getCollaborationUrl(),
      name: roomId,
      document: ydoc,
      token: null,
      onOpen: () => setConnectionStatus('connecting'),
      onConnect: () => setConnectionStatus('connected'),
      onDisconnect: () => setConnectionStatus('disconnected'),
      onClose: () => setConnectionStatus('disconnected'),
      onStatus: ({ status }) => setConnectionStatus(status),
      onAwarenessChange: () => {
        setPresenceUsers(extractPresence(provider.awareness))
        setAwarenessVersion((current) => current + 1)
      }
    })

    const handleUpdate = () => {
      setBoardVersion((current) => current + 1)
    }

    const session = { ydoc, provider }

    collaborationRef.current = session
    setCollaborationSession(session)
    setBoardVersion(0)
    setLocalDraftStroke(null)
    setProviderPresence(provider, 'user', presenceProfile)
    setPresenceUsers(extractPresence(provider.awareness))
    ydoc.on('update', handleUpdate)

    return () => {
      ydoc.off('update', handleUpdate)
      provider.destroy()
      ydoc.destroy()
      collaborationRef.current = null
      setCollaborationSession(null)
      setPresenceUsers([])
      setLocalDraftStroke(null)
    }
  }, [documentMeta, presenceProfile, roomId])

  useEffect(() => {
    const provider = collaborationRef.current?.provider

    if (!provider) {
      return
    }

    setProviderPresence(provider, 'user', presenceProfile)
  }, [presenceProfile])

  useEffect(() => {
    const element = boardRef.current

    if (!element) {
      return undefined
    }

    const resizeCanvas = () => {
      const rect = element.getBoundingClientRect()
      setCanvasSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height))
      })
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [documentMeta])

  const strokes = useMemo(() => {
    if (!collaborationSession) {
      return []
    }

    return readWhiteboardStrokes(collaborationSession.ydoc)
  }, [boardVersion, collaborationSession])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) {
      return
    }

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    strokes.forEach((stroke) => {
      drawStroke(context, stroke, canvas)
    })

    presenceUsers.forEach((collaborator) => {
      if (collaborator.id !== presenceProfile.id && collaborator.draftStroke?.points?.length) {
        drawStroke(context, collaborator.draftStroke, canvas)
      }
    })

    if (localDraftStroke?.points?.length) {
      drawStroke(context, localDraftStroke, canvas)
    }

    presenceUsers.forEach((collaborator) => {
      if (collaborator.id !== presenceProfile.id) {
        drawCursor(context, collaborator.cursor, canvas, collaborator.color || '#2563eb', collaborator.name)
      }
    })
  }, [awarenessVersion, canvasSize, localDraftStroke, presenceProfile.id, presenceUsers, strokes])

  const updateCursorPresence = (point) => {
    const provider = collaborationRef.current?.provider

    if (!provider) {
      return
    }

    setProviderPresence(provider, 'cursor', point ? {
      x: clampPoint(point.x),
      y: clampPoint(point.y)
    } : null)
  }

  const updateDraftPresence = (draftStroke) => {
    const provider = collaborationRef.current?.provider

    if (!provider) {
      return
    }

    setProviderPresence(provider, 'draftStroke', draftStroke)
  }

  const drawSegment = (fromPoint, toPoint, activeTool, activeColor, activeWidth) => {
    const canvas = canvasRef.current

    if (!canvas || !fromPoint || !toPoint) {
      return
    }

    const context = canvas.getContext('2d')

    context.save()
    context.globalCompositeOperation = getStrokeComposite(activeTool)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = activeTool === 'eraser' ? '#ffffff' : activeColor
    context.lineWidth = Number(activeWidth) || 2
    context.beginPath()
    context.moveTo(fromPoint.x, fromPoint.y)
    context.lineTo(toPoint.x, toPoint.y)
    context.stroke()
    context.restore()
  }

  const startDrawing = (event) => {
    if (!canvasRef.current) {
      return
    }

    if (typeof event.button === 'number' && event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)

    const rect = canvasRef.current.getBoundingClientRect()
    const point = normalizePoint(event.clientX, event.clientY, rect)
    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    const draftStroke = {
      id: `${presenceProfile.id}-draft`,
      tool,
      color: tool === 'eraser' ? '#ffffff' : color,
      width: Number(strokeWidth),
      points: [point],
      createdBy: presenceProfile.id
    }

    drawingRef.current = {
      isDrawing: true,
      points: [point],
      lastCanvasPoint: canvasPoint
    }

    setLocalDraftStroke(draftStroke)
    drawSegment(canvasPoint, { x: canvasPoint.x + 0.01, y: canvasPoint.y + 0.01 }, tool, color, strokeWidth)

    if (collaborationSession) {
      updateCursorPresence(point)
      updateDraftPresence(draftStroke)
    }
  }

  const draw = (event) => {
    if (!canvasRef.current) {
      return
    }

    event.preventDefault()

    const rect = canvasRef.current.getBoundingClientRect()
    const point = normalizePoint(event.clientX, event.clientY, rect)
    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    if (!drawingRef.current.isDrawing) {
      if (collaborationSession) {
        updateCursorPresence(point)
      }
      return
    }

    const previousCanvasPoint = drawingRef.current.lastCanvasPoint || canvasPoint
    const nextPoints = [...drawingRef.current.points, point]
    drawingRef.current = {
      isDrawing: true,
      points: nextPoints,
      lastCanvasPoint: canvasPoint
    }

    const draftStroke = {
      id: `${presenceProfile.id}-draft`,
      tool,
      color: tool === 'eraser' ? '#ffffff' : color,
      width: Number(strokeWidth),
      points: nextPoints,
      createdBy: presenceProfile.id
    }

    setLocalDraftStroke(draftStroke)
    drawSegment(previousCanvasPoint, canvasPoint, tool, color, strokeWidth)

    if (collaborationSession) {
      updateCursorPresence(point)
      updateDraftPresence(draftStroke)
    }
  }

  const stopDrawing = (event) => {
    event?.currentTarget?.releasePointerCapture?.(event.pointerId)

    if (!drawingRef.current.isDrawing || !collaborationSession) {
      drawingRef.current = {
        isDrawing: false,
        points: [],
        lastCanvasPoint: null
      }
      setLocalDraftStroke(null)
      updateDraftPresence(null)
      return
    }

    const points = drawingRef.current.points

    if (points.length > 0) {
      const strokesArray = collaborationSession.ydoc.getArray('strokes')

      collaborationSession.ydoc.transact(() => {
        strokesArray.push([{
          id: createStrokeId(),
          tool,
          color: tool === 'eraser' ? '#ffffff' : color,
          width: Number(strokeWidth),
          points,
          createdBy: presenceProfile.id,
          createdAt: new Date().toISOString()
        }])
      })
    }

    drawingRef.current = {
      isDrawing: false,
      points: [],
      lastCanvasPoint: null
    }

    setLocalDraftStroke(null)
    updateDraftPresence(null)
  }

  const handlePointerLeave = () => {
    if (drawingRef.current.isDrawing) {
      return
    }

    updateCursorPresence(null)
  }

  const clearBoard = () => {
    if (!collaborationSession) {
      return
    }

    const confirmed = window.confirm('Clear the whiteboard for everyone?')

    if (!confirmed) {
      return
    }

    const strokesArray = collaborationSession.ydoc.getArray('strokes')

    collaborationSession.ydoc.transact(() => {
      strokesArray.delete(0, strokesArray.length)
    })

    toast.success('Whiteboard cleared')
  }

  const handleSave = () => {
    const dataURL = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = dataURL
    link.click()
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Whiteboard link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy whiteboard link')
    }
  }

  if (roomId === 'new' || loading || authLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 size={42} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-medium text-slate-300">Preparing your collaborative whiteboard...</p>
        </div>
      </div>
    )
  }

  if (!documentMeta) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Whiteboard unavailable</h2>
          <p className="mt-3 text-sm text-slate-400">
            This shared whiteboard could not be loaded. Check the URL or create a new whiteboard from the dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-4">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,1))] shadow-[0_30px_80px_-40px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Shared Whiteboard</p>
              <h2 className="truncate text-xl font-semibold text-white">{documentMeta.title || 'Untitled Whiteboard'}</h2>
            </div>

            <div className="flex items-center space-x-2 rounded-xl bg-white/[0.05] p-1">
              {tools.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTool(item.id)}
                    className={`rounded-lg px-3 py-2 transition-colors ${tool === item.id ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-white/[0.08]'}`}
                    title={item.label}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <Palette size={16} className="text-slate-400" />
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
              />
              <div className="flex gap-1">
                {whiteboardColors.map((itemColor) => (
                  <button
                    key={itemColor}
                    type="button"
                    onClick={() => setColor(itemColor)}
                    className={`h-5 w-5 rounded-full border-2 ${color === itemColor ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: itemColor }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
              <span>Size</span>
              <input
                type="range"
                min="2"
                max="24"
                value={strokeWidth}
                onChange={(event) => setStrokeWidth(Number(event.target.value))}
                className="w-24"
              />
              <span className="w-10 text-right text-slate-400">{strokeWidth}px</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-slate-300">
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {connectionStatus === 'connected' ? 'Live sync connected' : 'Connecting'}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {presenceUsers.slice(0, 4).map((collaborator) => (
                  <div
                    key={`${collaborator.clientId}-${collaborator.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: collaborator.color }}
                    title={collaborator.id === presenceProfile.id ? `${collaborator.name} (You)` : collaborator.name}
                  >
                    {getInitials(collaborator.name)}
                  </div>
                ))}
              </div>
              <span className="text-sm text-slate-400">
                {presenceUsers.length || 1} collaborator{(presenceUsers.length || 1) > 1 ? 's' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={clearBoard}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
            >
              <Save size={16} />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.1]"
            >
              <Share size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 text-sm text-slate-400">
          Drawings are synced live and saved automatically. Pen and eraser are shared for everyone on this board.
        </div>

        <div ref={boardRef} className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border-t border-white/5 bg-[linear-gradient(180deg,_rgba(15,23,42,0.35),_rgba(15,23,42,0.18)),linear-gradient(90deg,_rgba(255,255,255,0.04)_1px,_transparent_1px),linear-gradient(180deg,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:auto,32px_32px,32px_32px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onLostPointerCapture={stopDrawing}
            onPointerLeave={handlePointerLeave}
          />
        </div>
      </div>
    </div>
  )
}

export default Whiteboard
