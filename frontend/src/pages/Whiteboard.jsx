import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pen, Eraser, Square, Circle, Type, Undo, Redo, Save, Share, Palette } from 'lucide-react'
import { documentAPI } from '../services/api'
import UserPresence from '../components/Collaboration/UserPresence'
import { useCollaboration } from '../hooks/useCollaboration'
import { useAuth } from '../contexts/AuthContext'

const Whiteboard = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef()
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)

  const { user } = useAuth()
  useEffect(() => {
    if (user && roomId === 'new') {
      const createNew = async () => {
        try {
          const res = await documentAPI.createDocument({
            title: 'Untitled Whiteboard',
            content: '',
            type: 'whiteboard'
          })
          navigate(`/whiteboard/${res.data._id}`, { replace: true })
        } catch (error) {
          console.error('Failed to create whiteboard', error)
        }
      }
      createNew()
    }
  }, [roomId, user, navigate])

  const { socket, users, isConnected, sendMessage, joinRoom } = useCollaboration(roomId !== 'new' ? roomId : null, 'whiteboard')

  useEffect(() => {
    if (user && roomId && roomId !== 'new') {
      joinRoom({
        id: user.id,
        name: user.name,
        avatar: user.avatar
      })
    }
  }, [user, roomId, joinRoom])

  useEffect(() => {
    if (!socket || roomId === 'new') return

    socket.on('receive-update', (data) => {
      if (data.type === 'whiteboard') {
        const { x, y, lastX, lastY, color, width, isDrawing } = data.content
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(lastX, lastY)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    })

    return () => {
      socket.off('receive-update')
    }
  }, [socket])

  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })

  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' }
  ]

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize canvas
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLastPos({ x, y })

    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineTo(x, y)
    ctx.stroke()

    sendMessage('send-update', {
      roomId,
      type: 'whiteboard',
      content: {
        x, y,
        lastX: lastPos.x,
        lastY: lastPos.y,
        color,
        width: strokeWidth
      }
    })

    setLastPos({ x, y })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = dataURL
    link.click()
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Collaborative Whiteboard</h2>

            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {tools.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`p-2 rounded-lg transition-colors ${tool === t.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    title={t.label}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <div className="flex space-x-1">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'
                      }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Size:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{strokeWidth}px</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <UserPresence users={users} />

            <button
              onClick={() => { }}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Undo"
            >
              <Undo size={18} />
            </button>

            <button
              onClick={() => { }}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Redo"
            >
              <Redo size={18} />
            </button>

            <button
              onClick={clearCanvas}
              className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Clear
            </button>

            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Save size={16} />
              <span>Save</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Share size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="relative" style={{ height: '500px' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair canvas-container"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
    </div>
  )
}

export default Whiteboard