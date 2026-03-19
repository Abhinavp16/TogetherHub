import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import {
  Copy,
  Link2,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Users,
  Video,
  VideoOff
} from 'lucide-react'
import { roomAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org' }
  ]
}

const getSignalingUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  }

  return 'http://localhost:5000'
}

const formatMessageTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const VideoTile = ({
  label,
  subtitle,
  stream,
  muted = false,
  micStatus = 'on',
  videoStatus = 'on',
  accent = 'from-blue-500/20 via-cyan-500/10 to-slate-900/80'
}) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null
    }
  }, [stream])

  return (
    <div className="group relative min-h-[220px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_20px_60px_-32px_rgba(15,23,42,1)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`absolute inset-0 h-full w-full object-cover transition ${stream && videoStatus === 'on' ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(to_top,_rgba(2,6,23,0.88),_rgba(2,6,23,0.05)_50%,_rgba(2,6,23,0.32))]" />

      {(!stream || videoStatus !== 'on') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-bold text-white">
            {label?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="text-lg font-semibold text-white">{label}</p>
          <p className="mt-1 text-sm text-slate-300">
            {videoStatus === 'on' ? 'Waiting for video...' : 'Camera turned off'}
          </p>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4">
        <div>
          <p className="text-base font-semibold text-white">{label}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 ${micStatus === 'on' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {micStatus === 'on' ? <Mic size={18} /> : <MicOff size={18} />}
          </span>
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 ${videoStatus === 'on' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800/80 text-slate-300'}`}>
            {videoStatus === 'on' ? <Video size={18} /> : <VideoOff size={18} />}
          </span>
        </div>
      </div>
    </div>
  )
}

const MeetingRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const socketRef = useRef(null)
  const peerConnectionsRef = useRef({})
  const localStreamRef = useRef(null)
  const cameraTrackRef = useRef(null)
  const screenStreamRef = useRef(null)
  const selfSocketIdRef = useRef('')

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState([])
  const [remotePeers, setRemotePeers] = useState([])
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [localPreviewStream, setLocalPreviewStream] = useState(null)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [activePanel, setActivePanel] = useState('chat')

  const effectiveUser = useMemo(() => ({
    id: user?.id || user?._id || user?.email || 'guest',
    name: user?.name || 'Guest',
    avatar: user?.avatar || ''
  }), [user])

  const totalTiles = remotePeers.length + 1
  const gridClass = totalTiles <= 1
    ? 'grid-cols-1'
    : totalTiles === 2
      ? 'grid-cols-1 xl:grid-cols-2'
      : totalTiles <= 4
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3'

  const syncRemotePeerMetadata = (usersInRoom) => {
    setRemotePeers((currentPeers) =>
      currentPeers.map((peer) => {
        const match = usersInRoom.find((item) => item.socketId === peer.peerId)
        return match
          ? {
              ...peer,
              name: match.name || peer.name,
              avatar: match.avatar || peer.avatar,
              micStatus: match.micStatus || peer.micStatus,
              videoStatus: match.videoStatus || peer.videoStatus
            }
          : peer
      })
    )
  }

  const removePeer = (peerId) => {
    const peerConnection = peerConnectionsRef.current[peerId]
    if (peerConnection) {
      peerConnection.ontrack = null
      peerConnection.onicecandidate = null
      peerConnection.close()
      delete peerConnectionsRef.current[peerId]
    }

    setRemotePeers((currentPeers) => currentPeers.filter((peer) => peer.peerId !== peerId))
  }

  const replaceOutgoingVideoTrack = async (track) => {
    const peerEntries = Object.values(peerConnectionsRef.current)

    await Promise.all(
      peerEntries.map(async (connection) => {
        const sender = connection
          .getSenders()
          .find((item) => item.track && item.track.kind === 'video')

        if (sender) {
          await sender.replaceTrack(track || null)
        }
      })
    )
  }

  const attachLocalPreview = (videoTrack) => {
    const audioTracks = localStreamRef.current ? localStreamRef.current.getAudioTracks() : []
    const tracks = []

    if (videoTrack) {
      tracks.push(videoTrack)
    }

    audioTracks.forEach((track) => tracks.push(track))
    setLocalPreviewStream(tracks.length > 0 ? new MediaStream(tracks) : null)
  }

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      cameraTrackRef.current = stream.getVideoTracks()[0] || null
      attachLocalPreview(cameraTrackRef.current)
      return stream
    } catch (error) {
      console.error('Failed to access camera or microphone', error)
      setMediaError('Camera or microphone access was blocked. Allow permissions to join the meeting fully.')
      toast.error('Unable to access camera or microphone')
      return null
    }
  }

  const createPeerConnection = (peerId, peerMeta = {}) => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId]
    }

    const peerConnection = new RTCPeerConnection(rtcConfiguration)

    peerConnectionsRef.current[peerId] = peerConnection

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current)
      })
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('meeting-ice-candidate', {
          candidate: event.candidate,
          targetPeerId: peerId
        })
      }
    }

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams

      setRemotePeers((currentPeers) => {
        const existing = currentPeers.find((peer) => peer.peerId === peerId)
        const nextPeer = {
          peerId,
          stream,
          name: peerMeta.name || existing?.name || 'Guest',
          avatar: peerMeta.avatar || existing?.avatar || '',
          micStatus: peerMeta.micStatus || existing?.micStatus || 'on',
          videoStatus: peerMeta.videoStatus || existing?.videoStatus || 'on'
        }

        if (existing) {
          return currentPeers.map((peer) => (peer.peerId === peerId ? nextPeer : peer))
        }

        return [...currentPeers, nextPeer]
      })
    }

    peerConnection.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(peerConnection.connectionState)) {
        removePeer(peerId)
      }
    }

    return peerConnection
  }

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    if (cameraTrackRef.current) {
      cameraTrackRef.current.enabled = isVideoEnabled
      await replaceOutgoingVideoTrack(cameraTrackRef.current)
    }

    attachLocalPreview(cameraTrackRef.current)
    setIsScreenSharing(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Meeting link copied')
    } catch (error) {
      toast.error('Unable to copy meeting link')
    }
  }

  const toggleMic = () => {
    const nextEnabled = !isMicEnabled
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextEnabled
      })
    }

    setIsMicEnabled(nextEnabled)
    socketRef.current?.emit('meeting-action', { action: nextEnabled ? 'unmute' : 'mute' })
  }

  const toggleVideo = () => {
    const nextEnabled = !isVideoEnabled

    if (isScreenSharing && screenStreamRef.current) {
      screenStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextEnabled
      })
    } else if (cameraTrackRef.current) {
      cameraTrackRef.current.enabled = nextEnabled
    }

    setIsVideoEnabled(nextEnabled)
    socketRef.current?.emit('meeting-action', { action: nextEnabled ? 'videoon' : 'videooff' })
  }

  const toggleScreenShare = async () => {
    if (!room?.meetingSettings?.allowScreenShare) {
      return
    }

    if (isScreenSharing) {
      await stopScreenShare()
      return
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = displayStream.getVideoTracks()[0]

      screenTrack.enabled = isVideoEnabled
      screenStreamRef.current = displayStream

      await replaceOutgoingVideoTrack(screenTrack)
      attachLocalPreview(screenTrack)
      setIsScreenSharing(true)

      screenTrack.onended = () => {
        stopScreenShare()
      }
    } catch (error) {
      console.error('Screen share failed', error)
      toast.error('Unable to start screen sharing')
    }
  }

  const handleSendMessage = (event) => {
    event.preventDefault()
    const trimmedMessage = messageInput.trim()

    if (!trimmedMessage || !socketRef.current) {
      return
    }

    socketRef.current.emit('meeting-chat-message', {
      roomId,
      message: trimmedMessage,
      sender: {
        id: effectiveUser.id,
        name: effectiveUser.name
      }
    })
    setMessageInput('')
  }

  useEffect(() => {
    if (!user || roomId !== 'new') return

    const createMeetingRoom = async () => {
      try {
        const response = await roomAPI.createRoom({
          name: 'Instant Meeting Room',
          description: 'Quick video sync space',
          type: 'video',
          isPrivate: false,
          invites: []
        })
        navigate(`/video/${response.data._id}`, { replace: true })
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create meeting room')
        navigate('/rooms')
      }
    }

    createMeetingRoom()
  }, [roomId, user, navigate])

  useEffect(() => {
    if (!user || !roomId || roomId === 'new') return

    let isActive = true

    const initializeRoom = async () => {
      setLoading(true)

      try {
        const [roomResponse] = await Promise.all([
          roomAPI.getRoom(roomId),
          roomAPI.joinRoom(roomId)
        ])

        if (!isActive) {
          return
        }

        setRoom(roomResponse.data)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load meeting room')
        navigate('/rooms')
      }
    }

    initializeRoom()

    return () => {
      isActive = false
    }
  }, [roomId, user, navigate])

  useEffect(() => {
    if (!room || !user || roomId === 'new') return

    let cancelled = false
    const serverUrl = getSignalingUrl()
    const socket = io(serverUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    const initializeMeeting = async () => {
      socket.on('connect', () => {
        setIsConnected(true)
        socket.emit('meeting-join-room', {
          roomId,
          user: effectiveUser
        })
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Meeting socket connection failed', error)
        toast.error('Unable to connect to the meeting server')
        setLoading(false)
      })

      socket.on('meeting-room-joined', async ({ peers, peerDetails, selfId }) => {
        selfSocketIdRef.current = selfId

        for (const peerId of peers) {
          const peerConnection = createPeerConnection(peerId, peerDetails[peerId] || {})
          const offer = await peerConnection.createOffer()
          await peerConnection.setLocalDescription(offer)
          socket.emit('meeting-offer', {
            offer,
            targetPeerId: peerId
          })
        }

        setLoading(false)
      })

      socket.on('meeting-users-update', (usersInRoom) => {
        setParticipants(usersInRoom)
        syncRemotePeerMetadata(usersInRoom)
        setLoading(false)
      })

      socket.on('meeting-offer', async ({ offer, fromPeerId, user: peerUser, micStatus, videoStatus }) => {
        const peerConnection = createPeerConnection(fromPeerId, {
          ...peerUser,
          micStatus,
          videoStatus
        })

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        socket.emit('meeting-answer', {
          answer,
          targetPeerId: fromPeerId
        })
      })

      socket.on('meeting-answer', async ({ answer, fromPeerId }) => {
        const peerConnection = peerConnectionsRef.current[fromPeerId]
        if (!peerConnection) return

        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      })

      socket.on('meeting-ice-candidate', async ({ candidate, fromPeerId }) => {
        const peerConnection = peerConnectionsRef.current[fromPeerId]
        if (!peerConnection || !candidate) return

        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.error('Failed to add ICE candidate', error)
        }
      })

      socket.on('meeting-action', ({ action, peerId }) => {
        setRemotePeers((currentPeers) =>
          currentPeers.map((peer) => {
            if (peer.peerId !== peerId) return peer

            if (action === 'mute') return { ...peer, micStatus: 'off' }
            if (action === 'unmute') return { ...peer, micStatus: 'on' }
            if (action === 'videooff') return { ...peer, videoStatus: 'off' }
            if (action === 'videoon') return { ...peer, videoStatus: 'on' }

            return peer
          })
        )
      })

      socket.on('meeting-chat-message', (message) => {
        setMessages((currentMessages) => [...currentMessages, message])
      })

      socket.on('meeting-remove-peer', ({ peerId }) => {
        removePeer(peerId)
      })

      await ensureLocalMedia()
      if (cancelled) return

      socket.connect()
    }

    initializeMeeting()

    return () => {
      cancelled = true
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null

      Object.keys(peerConnectionsRef.current).forEach((peerId) => {
        removePeer(peerId)
      })

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      cameraTrackRef.current = null
      setLocalPreviewStream(null)
    }
  }, [room, roomId, user, effectiveUser])

  const leaveMeeting = async () => {
    if (isScreenSharing) {
      await stopScreenShare()
    }

    navigate('/rooms')
  }

  if (roomId === 'new' || loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 size={42} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-medium text-slate-300">Preparing your meeting room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,1),_rgba(3,7,18,1))] text-white">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Video Meeting
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {room?.name || 'Meeting Room'}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${isConnected ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/30 bg-rose-500/10 text-rose-300'}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isConnected ? 'Connected' : 'Reconnecting'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                {participants.length || 1} participant{(participants.length || 1) > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.1]"
            >
              <Link2 size={16} />
              <span>Copy Invite Link</span>
            </button>
            <button
              onClick={() => {
                setPanelOpen(true)
                setActivePanel((current) => (current === 'chat' ? 'people' : 'chat'))
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.1]"
            >
              {activePanel === 'chat' ? <Users size={16} /> : <MessageSquare size={16} />}
              <span>{activePanel === 'chat' ? 'People' : 'Chat'}</span>
            </button>
          </div>
        </div>

        {mediaError && (
          <div className="border-b border-amber-400/10 bg-amber-500/10 px-6 py-3 text-sm text-amber-200">
            {mediaError}
          </div>
        )}

        <div className="flex-1 overflow-hidden p-5">
          <div className={`grid h-full min-h-0 gap-5 ${panelOpen ? 'grid-cols-[minmax(0,1fr)_340px]' : 'grid-cols-1'}`}>
            <section className="min-h-0 rounded-[2rem] border border-white/8 bg-slate-900/45 p-4 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
              <div className={`grid h-full min-h-0 gap-4 ${gridClass}`}>
                <VideoTile
                  label={`${effectiveUser.name} (You)`}
                  subtitle={isScreenSharing ? 'Sharing your screen' : 'Local preview'}
                  stream={localPreviewStream}
                  muted
                  micStatus={isMicEnabled ? 'on' : 'off'}
                  videoStatus={isVideoEnabled ? 'on' : 'off'}
                  accent="from-cyan-500/20 via-blue-500/10 to-slate-900/85"
                />

                {remotePeers.map((peer) => (
                  <VideoTile
                    key={peer.peerId}
                    label={peer.name}
                    subtitle="Connected"
                    stream={peer.stream}
                    micStatus={peer.micStatus}
                    videoStatus={peer.videoStatus}
                    accent="from-fuchsia-500/20 via-violet-500/10 to-slate-900/85"
                  />
                ))}
              </div>
            </section>

            {panelOpen && (
              <aside className="flex min-h-0 flex-col rounded-[2rem] border border-white/8 bg-slate-900/70 shadow-[0_24px_80px_-40px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 border-b border-white/8 p-3">
                  <button
                    onClick={() => setActivePanel('chat')}
                    className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${activePanel === 'chat' ? 'bg-white text-slate-900' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MessageSquare size={16} />
                      Chat
                    </span>
                  </button>
                  <button
                    onClick={() => setActivePanel('people')}
                    className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${activePanel === 'people' ? 'bg-white text-slate-900' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Users size={16} />
                      People
                    </span>
                  </button>
                </div>

                {activePanel === 'chat' ? (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-modern">
                      {messages.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-slate-400">
                          No messages yet. Use chat to coordinate during the call.
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-white">{message.sender?.name || 'Guest'}</p>
                              <span className="text-xs text-slate-500">{formatMessageTime(message.timestamp)}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{message.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="border-t border-white/8 p-4">
                      <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(event) => setMessageInput(event.target.value)}
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-white transition hover:bg-blue-400"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-modern">
                    <div className="space-y-3">
                      {(participants.length ? participants : [{
                        socketId: selfSocketIdRef.current || 'local',
                        name: effectiveUser.name,
                        avatar: effectiveUser.avatar,
                        micStatus: isMicEnabled ? 'on' : 'off',
                        videoStatus: isVideoEnabled ? 'on' : 'off'
                      }]).map((participant) => (
                        <div key={participant.socketId} className="flex items-center gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-lg font-semibold text-white">
                            {participant.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {participant.socketId === selfSocketIdRef.current ? `${participant.name} (You)` : participant.name}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${participant.micStatus === 'on' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                                {participant.micStatus === 'on' ? <Mic size={12} /> : <MicOff size={12} />}
                                {participant.micStatus === 'on' ? 'Mic on' : 'Mic off'}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${participant.videoStatus === 'on' ? 'bg-blue-500/10 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>
                                {participant.videoStatus === 'on' ? <Video size={12} /> : <VideoOff size={12} />}
                                {participant.videoStatus === 'on' ? 'Camera on' : 'Camera off'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>

        <div className="border-t border-white/8 px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${isMicEnabled ? 'bg-white/[0.08] text-white hover:bg-white/[0.12]' : 'bg-rose-500 text-white hover:bg-rose-400'}`}
            >
              {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              <span>{isMicEnabled ? 'Mute' : 'Unmute'}</span>
            </button>

            <button
              onClick={toggleVideo}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${isVideoEnabled ? 'bg-white/[0.08] text-white hover:bg-white/[0.12]' : 'bg-rose-500 text-white hover:bg-rose-400'}`}
            >
              {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              <span>{isVideoEnabled ? 'Stop Camera' : 'Start Camera'}</span>
            </button>

            <button
              onClick={toggleScreenShare}
              disabled={!room?.meetingSettings?.allowScreenShare}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MonitorUp size={18} />
              <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              <Copy size={18} />
              <span>Copy Link</span>
            </button>

            <button
              onClick={leaveMeeting}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              <PhoneOff size={18} />
              <span>Leave Meeting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeetingRoom
