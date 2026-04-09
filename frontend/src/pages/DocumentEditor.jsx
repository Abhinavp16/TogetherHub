import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import {
  Bold,
  Copy,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Share2,
  Sparkles,
  Strikethrough,
  Undo2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { documentAPI, getCollaborationUrl, publicDocumentAPI } from '../services/api'

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

const createPresenceProfile = (user, displayName) => {
  if (user) {
    const fallbackColor = collaboratorColors[String(user.id || user._id || user.email || user.name).length % collaboratorColors.length]

    return {
      id: user.id || user._id || user.email,
      name: displayName || user.name,
      color: fallbackColor,
      avatar: user.avatar || '',
      typing: false,
      isGuest: false
    }
  }

  const guestProfile = buildGuestProfile()

  return {
    ...guestProfile,
    name: displayName || guestProfile.name,
    typing: false
  }
}

const extractPresence = (awareness) => {
  if (!awareness) {
    return []
  }

  return Array.from(awareness.getStates().values())
    .map((state) => state.user)
    .filter(Boolean)
}

const ToolbarButton = ({ active = false, onClick, title, children, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`document-toolbar-button ${active ? 'document-toolbar-button--active' : ''}`}
  >
    {children}
  </button>
)

const setProviderPresence = (provider, profile) => {
  if (!provider) {
    return
  }

  provider.setAwarenessField('user', profile)
}

const DocumentEditor = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const typingTimeoutRef = useRef(null)
  const legacyBootstrapRef = useRef(false)
  const collaborationRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('Untitled Document')
  const [documentMeta, setDocumentMeta] = useState(null)
  const [providerReady, setProviderReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [presenceUsers, setPresenceUsers] = useState([])
  const [displayName, setDisplayName] = useState(() => user?.name || buildGuestProfile().name)
  const [titleSaveState, setTitleSaveState] = useState('saved')
  const [lastSavedLabel, setLastSavedLabel] = useState('')

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name)
      return
    }

    localStorage.setItem('guestDisplayName', displayName)
  }, [displayName, user])

  const presenceProfile = useMemo(() => createPresenceProfile(user, displayName), [displayName, user])

  useEffect(() => {
    if (roomId !== 'new') {
      return undefined
    }

    if (authLoading) {
      return undefined
    }

    if (!user) {
      toast.error('Please log in to create a new document')
      navigate('/login', { replace: true })
      return undefined
    }

    let cancelled = false

    const createDocument = async () => {
      try {
        const response = await documentAPI.createDocument({
          title: 'Untitled Document',
          content: '',
          type: 'text',
          shareAccess: 'link'
        })

        if (!cancelled) {
          navigate(`/document/${response.data._id}`, { replace: true })
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create document')
        navigate('/', { replace: true })
      }
    }

    createDocument()

    return () => {
      cancelled = true
    }
  }, [authLoading, navigate, roomId, user])

  useEffect(() => {
    if (!roomId || roomId === 'new') {
      return undefined
    }

    let cancelled = false

    const loadDocument = async () => {
      setLoading(true)

      try {
        const response = await publicDocumentAPI.getDocument(roomId)

        if (cancelled) {
          return
        }

        setDocumentMeta(response.data)
        setTitle(response.data.title || 'Untitled Document')
        setLastSavedLabel(response.data.updatedAt ? new Date(response.data.updatedAt).toLocaleTimeString() : '')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load shared document')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [roomId])

  const [collaborationKey, setCollaborationKey] = useState(0)

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
      onSynced: () => {
        setProviderReady(true)
        setLastSavedLabel(new Date().toLocaleTimeString())
      },
      onAwarenessChange: () => {
        setPresenceUsers(extractPresence(provider.awareness))
      }
    })

    legacyBootstrapRef.current = false
    collaborationRef.current = { ydoc, provider }
    setProviderReady(false)
    setProviderPresence(provider, presenceProfile)
    setPresenceUsers(extractPresence(provider.awareness))
    setCollaborationKey((current) => current + 1)

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      provider.destroy()
      ydoc.destroy()
      collaborationRef.current = null
      setPresenceUsers([])
      setProviderReady(false)
    }
  }, [documentMeta, roomId])

  const collaborationSession = collaborationRef.current

  const editor = useEditor(
    {
      immediatelyRender: false,
      autofocus: Boolean(collaborationSession),
      editable: Boolean(collaborationSession),
      editorProps: {
        attributes: {
          class: 'document-tiptap prose prose-slate max-w-none dark:prose-invert focus:outline-none'
        }
      },
      extensions: collaborationSession
        ? [
            StarterKit.configure({
              undoRedo: false
            }),
            Placeholder.configure({
              placeholder: 'Start writing together...'
            }),
            Collaboration.configure({
              document: collaborationSession.ydoc
            })
          ]
        : [
            StarterKit.configure({
              undoRedo: false
            }),
            Placeholder.configure({
              placeholder: 'Preparing collaboration session...'
            })
      ],
      onCreate: () => {
        if (!collaborationSession) {
          return
        }

        setProviderPresence(collaborationSession.provider, presenceProfile)
      },
      onUpdate: () => {
        if (!collaborationSession) {
          return
        }

        setProviderPresence(collaborationSession.provider, {
          ...presenceProfile,
          typing: true
        })

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = window.setTimeout(() => {
          setProviderPresence(collaborationSession.provider, {
            ...presenceProfile,
            typing: false
          })
        }, 1200)
      },
      onBlur: () => {
        if (!collaborationSession) {
          return
        }

        setProviderPresence(collaborationSession.provider, {
          ...presenceProfile,
          typing: false
        })
      }
    },
    [collaborationKey, presenceProfile.id, presenceProfile.name, presenceProfile.color]
  )

  useEffect(() => {
    const provider = collaborationRef.current?.provider

    if (!provider) {
      return
    }

    setProviderPresence(provider, presenceProfile)
  }, [editor, presenceProfile])

  useEffect(() => {
    if (!editor || !providerReady || !documentMeta || legacyBootstrapRef.current) {
      return
    }

    if (documentMeta.hasCollaborationState || !documentMeta.legacyContent || !editor.isEmpty) {
      legacyBootstrapRef.current = true
      return
    }

    editor.commands.setContent(documentMeta.legacyContent)
    legacyBootstrapRef.current = true
    toast.success('Imported existing document content into live collaboration')
  }, [documentMeta, editor, providerReady])

  useEffect(() => {
    if (!documentMeta || roomId === 'new') {
      return undefined
    }

    if (title === documentMeta.title) {
      return undefined
    }

    setTitleSaveState('saving')

    const timer = window.setTimeout(async () => {
      try {
        const response = await publicDocumentAPI.updateDocument(roomId, { title })
        setDocumentMeta((current) => ({
          ...current,
          ...response.data
        }))
        setLastSavedLabel(new Date().toLocaleTimeString())
        setTitleSaveState('saved')
      } catch (error) {
        setTitleSaveState('error')
        toast.error(error.response?.data?.message || 'Failed to save title')
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [documentMeta, roomId, title])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Document link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy document link')
    }
  }

  const activeCollaborators = presenceUsers.length ? presenceUsers : [presenceProfile]
  const typingUsers = activeCollaborators.filter((collaborator) => collaborator.typing && collaborator.id !== presenceProfile.id)

  if (roomId === 'new' || loading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 size={42} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-medium text-slate-300">Preparing your collaborative document...</p>
        </div>
      </div>
    )
  }

  if (!documentMeta) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Document unavailable</h2>
          <p className="mt-3 text-sm text-slate-400">
            This shared document couldn&apos;t be loaded. Check the URL or create a new document from the dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="document-workspace h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_22%),linear-gradient(180deg,_rgba(2,6,23,1),_rgba(7,10,22,1))] text-white">
      <div className="flex h-full min-h-0 flex-col px-4 py-4 sm:px-6">
        <div className="mb-4 rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,1)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                Shared Document
              </p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full bg-transparent text-2xl font-bold tracking-tight text-white outline-none placeholder:text-slate-500"
                placeholder="Untitled Document"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className={`rounded-full border px-3 py-1 ${connectionStatus === 'connected' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
                  {connectionStatus === 'connected' ? 'Live sync connected' : 'Connecting collaboration'}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  {titleSaveState === 'saving' ? 'Saving title...' : titleSaveState === 'error' ? 'Title save failed' : `Saved ${lastSavedLabel || 'recently'}`}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  {activeCollaborators.length} active collaborator{activeCollaborators.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-slate-500">Displayed as</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Your name"
                />
              </label>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                <Share2 size={16} />
                <span>Share URL</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-h-0 flex-col rounded-[1.8rem] border border-white/10 bg-slate-900/65 shadow-[0_24px_80px_-40px_rgba(0,0,0,1)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <ToolbarButton
                  title="Undo"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor}
                >
                  <Undo2 size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Redo"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor}
                >
                  <Redo2 size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Bold"
                  active={editor?.isActive('bold')}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  disabled={!editor}
                >
                  <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Italic"
                  active={editor?.isActive('italic')}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  disabled={!editor}
                >
                  <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Strike"
                  active={editor?.isActive('strike')}
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  disabled={!editor}
                >
                  <Strikethrough size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Heading 1"
                  active={editor?.isActive('heading', { level: 1 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  disabled={!editor}
                >
                  <Heading1 size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Heading 2"
                  active={editor?.isActive('heading', { level: 2 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  disabled={!editor}
                >
                  <Heading2 size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Bullet list"
                  active={editor?.isActive('bulletList')}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  disabled={!editor}
                >
                  <List size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Ordered list"
                  active={editor?.isActive('orderedList')}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  disabled={!editor}
                >
                  <ListOrdered size={16} />
                </ToolbarButton>
                <ToolbarButton
                  title="Quote"
                  active={editor?.isActive('blockquote')}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  disabled={!editor}
                >
                  <Quote size={16} />
                </ToolbarButton>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-white px-6 py-6 text-slate-900 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)] sm:px-10 sm:py-8">
                {editor ? (
                  <EditorContent editor={editor} />
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center text-slate-400">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col rounded-[1.8rem] border border-white/10 bg-slate-900/70 shadow-[0_24px_80px_-40px_rgba(0,0,0,1)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Presence
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">Active collaborators</h3>
              <p className="mt-1 text-sm text-slate-400">
                Anyone with this URL can join and edit live.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {typingUsers.length > 0 && (
                <div className="rounded-[1.3rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles size={16} className="text-cyan-300" />
                    <span>{typingUsers.map((entry) => entry.name).join(', ')} typing…</span>
                  </div>
                </div>
              )}

              {activeCollaborators.map((collaborator) => (
                <div
                  key={`${collaborator.id}-${collaborator.name}`}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {collaborator.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {collaborator.id === presenceProfile.id ? `${collaborator.name} (You)` : collaborator.name}
                        </p>
                        {collaborator.isGuest && (
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            Guest
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {collaborator.typing ? 'Typing right now' : 'Connected to live session'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
              >
                <Copy size={16} />
                <span>Copy shareable link</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default DocumentEditor
