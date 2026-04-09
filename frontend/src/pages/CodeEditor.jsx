import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { MonacoBinding } from 'y-monaco'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  File,
  FileOutput,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  GitBranch,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  Pencil,
  Play,
  Save,
  Search,
  Share,
  Sun,
  Terminal,
  Trash2,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { documentAPI, getCollaborationUrl, publicCodeAPI } from '../services/api'
import {
  bootstrapCodeWorkspace,
  createWorkspaceNodeId,
  getDefaultCodeTemplate,
  getDescendantNodeIds,
  getNextSiblingOrder,
  getWorkspaceMaps,
  inferLanguageFromFileName,
  languageOptions,
  readWorkspaceSnapshot
} from '../utils/codeWorkspace'

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
      isGuest: false
    }
  }

  const guestProfile = buildGuestProfile()

  return {
    ...guestProfile,
    name: displayName || guestProfile.name
  }
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
        ...state.user
      }
    })
    .filter(Boolean)
}

const setProviderPresence = (provider, profile) => {
  if (!provider) {
    return
  }

  provider.setAwarenessField('user', profile)
}

const getInitials = (name) => {
  const segments = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (segments.length === 0) {
    return '?'
  }

  return segments.map((segment) => segment.charAt(0).toUpperCase()).join('')
}

const defaultWorkspaceSnapshot = {
  tree: [],
  files: [],
  fileIds: [],
  fileContents: {},
  firstFileId: null,
  byId: new Map()
}

const CodeEditor = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const bindingRef = useRef(null)
  const modelCacheRef = useRef(new Map())
  const collaborationRef = useRef(null)
  const bootstrapRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [documentMeta, setDocumentMeta] = useState(null)
  const [displayName, setDisplayName] = useState(() => user?.name || buildGuestProfile().name)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [providerReady, setProviderReady] = useState(false)
  const [presenceUsers, setPresenceUsers] = useState([])
  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const [collaborationKey, setCollaborationKey] = useState(0)
  const [theme, setTheme] = useState('vs-dark')
  const [fontSize, setFontSize] = useState(14)
  const [output, setOutput] = useState([])
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'Terminal initialized. Type your commands here.' }
  ])
  const [activeTab, setActiveTab] = useState('output')
  const [showBottomPanel, setShowBottomPanel] = useState(true)
  const [panelHeight, setPanelHeight] = useState(250)
  const [showSidebar] = useState(true)
  const [sidebarWidth] = useState(280)
  const [expandedFolders, setExpandedFolders] = useState({})
  const [openFileIds, setOpenFileIds] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [cursorPosition, setCursorPosition] = useState('Ln 1, Col 1')
  const [editorReadyKey, setEditorReadyKey] = useState(0)

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
      toast.error('Please log in to create a new code workspace')
      navigate('/login', { replace: true })
      return undefined
    }

    let cancelled = false

    const createWorkspace = async () => {
      try {
        const response = await documentAPI.createDocument({
          title: 'Untitled Code Workspace',
          content: getDefaultCodeTemplate('javascript'),
          type: 'code',
          language: 'javascript',
          shareAccess: 'link'
        })

        if (!cancelled) {
          navigate(`/code/${response.data._id}`, { replace: true })
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create code workspace')
        navigate('/', { replace: true })
      }
    }

    createWorkspace()

    return () => {
      cancelled = true
    }
  }, [authLoading, navigate, roomId, user])

  useEffect(() => {
    if (!roomId || roomId === 'new') {
      return undefined
    }

    let cancelled = false

    const loadWorkspace = async () => {
      setLoading(true)

      try {
        const response = await publicCodeAPI.getDocument(roomId)

        if (cancelled) {
          return
        }

        setDocumentMeta(response.data)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load shared code workspace')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadWorkspace()

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
      onSynced: () => {
        setProviderReady(true)
      },
      onAwarenessChange: () => {
        setPresenceUsers(extractPresence(provider.awareness))
      }
    })

    const handleWorkspaceUpdate = () => {
      setWorkspaceVersion((current) => current + 1)
    }

    bootstrapRef.current = false
    setProviderReady(false)
    setWorkspaceVersion(0)
    collaborationRef.current = { ydoc, provider }
    setProviderPresence(provider, presenceProfile)
    setPresenceUsers(extractPresence(provider.awareness))
    ydoc.on('update', handleWorkspaceUpdate)
    setCollaborationKey((current) => current + 1)

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }

      ydoc.off('update', handleWorkspaceUpdate)
      provider.destroy()
      ydoc.destroy()
      collaborationRef.current = null
      setPresenceUsers([])
      setProviderReady(false)
    }
  }, [documentMeta, presenceProfile, roomId])

  useEffect(() => {
    const provider = collaborationRef.current?.provider

    if (!provider) {
      return
    }

    setProviderPresence(provider, presenceProfile)
  }, [presenceProfile])

  const collaborationSession = collaborationRef.current

  useEffect(() => {
    if (!providerReady || !documentMeta || !collaborationSession || bootstrapRef.current) {
      return
    }

    if (documentMeta.hasCollaborationState) {
      bootstrapRef.current = true
      return
    }

    const createdFileId = bootstrapCodeWorkspace(collaborationSession.ydoc, {
      content: documentMeta.legacyContent,
      language: documentMeta.language || 'javascript'
    })

    bootstrapRef.current = true

    if (createdFileId) {
      setActiveFileId(createdFileId)
      setOpenFileIds([createdFileId])
      toast.success('Imported existing code into the live workspace')
    }
  }, [collaborationSession, documentMeta, providerReady])

  const workspaceSnapshot = useMemo(() => {
    if (!collaborationSession) {
      return defaultWorkspaceSnapshot
    }

    return readWorkspaceSnapshot(collaborationSession.ydoc)
  }, [collaborationKey, collaborationSession, workspaceVersion])

  useEffect(() => {
    const existingFileIds = workspaceSnapshot.fileIds

    setOpenFileIds((current) => {
      const next = current.filter((fileId) => existingFileIds.includes(fileId))

      if (activeFileId && existingFileIds.includes(activeFileId) && !next.includes(activeFileId)) {
        next.push(activeFileId)
      }

      if (next.length === 0 && workspaceSnapshot.firstFileId) {
        return [workspaceSnapshot.firstFileId]
      }

      return next
    })

    setActiveFileId((current) => {
      if (current && existingFileIds.includes(current)) {
        return current
      }

      return workspaceSnapshot.firstFileId
    })
  }, [activeFileId, workspaceSnapshot.fileIds, workspaceSnapshot.firstFileId])

  useEffect(() => {
    const existingFileIds = new Set(workspaceSnapshot.fileIds)

    modelCacheRef.current.forEach((model, fileId) => {
      if (!existingFileIds.has(fileId)) {
        if (editorRef.current?.getModel?.() === model) {
          editorRef.current.setModel(null)
        }

        model.dispose()
        modelCacheRef.current.delete(fileId)
      }
    })
  }, [workspaceSnapshot.fileIds])

  useEffect(() => {
    if (!collaborationSession || !editorRef.current || !monacoRef.current || !activeFileId) {
      return undefined
    }

    const file = workspaceSnapshot.byId.get(activeFileId)

    if (!file) {
      return undefined
    }

    const { contents } = getWorkspaceMaps(collaborationSession.ydoc)
    const ytext = contents.get(activeFileId)

    if (!ytext) {
      return undefined
    }

    let model = modelCacheRef.current.get(activeFileId)

    if (!model || model.isDisposed()) {
      const uri = monacoRef.current.Uri.parse(`inmemory://workspace/${activeFileId}/${encodeURIComponent(file.name)}`)
      model = monacoRef.current.editor.createModel('', file.language || 'javascript', uri)
      modelCacheRef.current.set(activeFileId, model)
    }

    monacoRef.current.editor.setModelLanguage(model, file.language || 'javascript')
    editorRef.current.setModel(model)
    bindingRef.current?.destroy()
    const binding = new MonacoBinding(ytext, model, new Set([editorRef.current]), null)
    bindingRef.current = binding

    return () => {
      binding.destroy()

      if (bindingRef.current === binding) {
        bindingRef.current = null
      }
    }
  }, [activeFileId, collaborationSession, editorReadyKey, workspaceSnapshot.byId])

  useEffect(() => {
    return () => {
      modelCacheRef.current.forEach((model) => {
        model.dispose()
      })

      modelCacheRef.current.clear()
    }
  }, [])

  const activeCollaborators = presenceUsers.length ? presenceUsers : [presenceProfile]
  const activeFile = activeFileId ? workspaceSnapshot.byId.get(activeFileId) : null
  const currentLanguage = activeFile?.language || documentMeta?.language || 'javascript'
  const isConnected = connectionStatus === 'connected'

  const openFile = (fileId) => {
    setActiveFileId(fileId)
    setOpenFileIds((current) => {
      if (current.includes(fileId)) {
        return current
      }

      return [...current, fileId]
    })
  }

  const closeFile = (fileId) => {
    setOpenFileIds((current) => {
      const next = current.filter((id) => id !== fileId)

      if (next.length === 0 && workspaceSnapshot.firstFileId && workspaceSnapshot.firstFileId !== fileId) {
        return [workspaceSnapshot.firstFileId]
      }

      return next
    })

    setActiveFileId((current) => {
      if (current !== fileId) {
        return current
      }

      const remaining = openFileIds.filter((id) => id !== fileId)
      return remaining.at(-1) || workspaceSnapshot.firstFileId
    })
  }

  const expandFolderPath = (parentId) => {
    if (!parentId) {
      return
    }

    setExpandedFolders((current) => {
      const next = { ...current }
      let cursor = parentId

      while (cursor) {
        next[cursor] = true
        cursor = workspaceSnapshot.byId.get(cursor)?.parentId || null
      }

      return next
    })
  }

  const withWorkspaceTransaction = (callback) => {
    if (!collaborationSession) {
      toast.error('Collaboration session is not ready yet')
      return
    }

    collaborationSession.ydoc.transact(() => {
      callback(getWorkspaceMaps(collaborationSession.ydoc))
    })
  }

  const createFile = (parentId = null) => {
    const suggestedName = window.prompt('File name', 'main.js')

    if (!suggestedName) {
      return
    }

    const name = suggestedName.trim()

    if (!name) {
      toast.error('File name is required')
      return
    }

    const language = inferLanguageFromFileName(name, 'javascript')
    const fileId = createWorkspaceNodeId('file')

    withWorkspaceTransaction(({ nodes, contents }) => {
      nodes.set(fileId, {
        id: fileId,
        kind: 'file',
        name,
        parentId,
        language,
        order: getNextSiblingOrder(collaborationSession.ydoc, parentId)
      })

      const ytext = new Y.Text()
      ytext.insert(0, getDefaultCodeTemplate(language))
      contents.set(fileId, ytext)
    })

    expandFolderPath(parentId)
    openFile(fileId)
    toast.success(`Created ${name}`)
  }

  const createFolder = (parentId = null) => {
    const suggestedName = window.prompt('Folder name', 'src')

    if (!suggestedName) {
      return
    }

    const name = suggestedName.trim()

    if (!name) {
      toast.error('Folder name is required')
      return
    }

    const folderId = createWorkspaceNodeId('folder')

    withWorkspaceTransaction(({ nodes }) => {
      nodes.set(folderId, {
        id: folderId,
        kind: 'folder',
        name,
        parentId,
        order: getNextSiblingOrder(collaborationSession.ydoc, parentId)
      })
    })

    expandFolderPath(parentId)
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: true
    }))
    toast.success(`Created folder ${name}`)
  }

  const renameNode = (nodeId) => {
    const node = workspaceSnapshot.byId.get(nodeId)

    if (!node) {
      return
    }

    const suggestedName = window.prompt(`Rename ${node.kind}`, node.name)

    if (!suggestedName) {
      return
    }

    const name = suggestedName.trim()

    if (!name) {
      toast.error('Name is required')
      return
    }

    withWorkspaceTransaction(({ nodes }) => {
      nodes.set(nodeId, {
        ...node,
        name,
        language: node.kind === 'file' ? inferLanguageFromFileName(name, node.language || 'javascript') : node.language
      })
    })
  }

  const deleteNode = (nodeId) => {
    const node = workspaceSnapshot.byId.get(nodeId)

    if (!node) {
      return
    }

    const confirmed = window.confirm(`Delete ${node.name}?`)

    if (!confirmed) {
      return
    }

    const nodeIds = getDescendantNodeIds(collaborationSession.ydoc, nodeId)

    withWorkspaceTransaction(({ nodes, contents }) => {
      nodeIds.forEach((id) => {
        const currentNode = workspaceSnapshot.byId.get(id)
        nodes.delete(id)

        if (currentNode?.kind === 'file') {
          contents.delete(id)
        }
      })
    })
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: !current[folderId]
    }))
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    setEditorReadyKey((current) => current + 1)

    editor.onDidChangeCursorPosition((event) => {
      setCursorPosition(`Ln ${event.position.lineNumber}, Col ${event.position.column}`)
    })
  }

  const handleLanguageChange = (nextLanguage) => {
    if (!activeFileId || !activeFile) {
      return
    }

    withWorkspaceTransaction(({ nodes }) => {
      nodes.set(activeFileId, {
        ...activeFile,
        language: nextLanguage
      })
    })
  }

  const handleSave = () => {
    toast.success('Workspace changes sync automatically')
  }

  const handleDownload = () => {
    if (!activeFileId || !activeFile) {
      toast.error('Open a file before downloading')
      return
    }

    const modelValue = editorRef.current?.getValue?.() ?? workspaceSnapshot.fileContents[activeFileId] ?? ''
    const blob = new Blob([modelValue], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = activeFile.name
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (!activeFileId) {
      toast.error('Open a file before copying code')
      return
    }

    const modelValue = editorRef.current?.getValue?.() ?? workspaceSnapshot.fileContents[activeFileId] ?? ''

    try {
      await navigator.clipboard.writeText(modelValue)
      toast.success('Current file copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Workspace link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy workspace link')
    }
  }

  const handleRun = () => {
    if (!activeFileId) {
      toast.error('Create or open a file first')
      return
    }

    const source = editorRef.current?.getValue?.() ?? workspaceSnapshot.fileContents[activeFileId] ?? ''
    setShowBottomPanel(true)
    setActiveTab('output')
    setOutput([])

    const timestamp = new Date().toLocaleTimeString()

    try {
      const logs = []
      const originalLog = console.log
      const originalError = console.error
      const originalWarn = console.warn

      console.log = (...args) => {
        logs.push({ type: 'log', message: args.join(' ') })
        originalLog(...args)
      }
      console.error = (...args) => {
        logs.push({ type: 'error', message: args.join(' ') })
        originalError(...args)
      }
      console.warn = (...args) => {
        logs.push({ type: 'warn', message: args.join(' ') })
        originalWarn(...args)
      }

      setOutput([{ type: 'info', message: `[${timestamp}] Running ${currentLanguage} code...` }])

      if (currentLanguage === 'javascript') {
        eval(source)
        console.log = originalLog
        console.error = originalError
        console.warn = originalWarn

        if (logs.length > 0) {
          setOutput((current) => [...current, ...logs, { type: 'success', message: `[${timestamp}] Execution completed successfully.` }])
        } else {
          setOutput((current) => [...current, { type: 'success', message: `[${timestamp}] Code executed successfully (no output).` }])
        }
      } else {
        console.log = originalLog
        console.error = originalError
        console.warn = originalWarn
        setOutput((current) => [...current, { type: 'warn', message: `Browser execution is only enabled for JavaScript. ${currentLanguage} stays local for editing and sharing.` }])
      }
    } catch (error) {
      setOutput((current) => [...current, { type: 'error', message: `Error: ${error.message}` }])
    }
  }

  const handleTerminalSubmit = (event) => {
    event.preventDefault()

    if (!terminalInput.trim()) {
      return
    }

    const newHistory = [...terminalHistory, { type: 'input', text: `$ ${terminalInput}` }]

    if (terminalInput === 'clear') {
      setTerminalHistory([{ type: 'system', text: 'Terminal cleared.' }])
    } else if (terminalInput === 'help') {
      setTerminalHistory([
        ...newHistory,
        { type: 'output', text: 'Available commands:' },
        { type: 'output', text: '  clear  - Clear terminal' },
        { type: 'output', text: '  help   - Show this help' },
        { type: 'output', text: '  run    - Run the current file' }
      ])
    } else if (terminalInput === 'run') {
      setTerminalHistory([...newHistory, { type: 'output', text: 'Running current file...' }])
      handleRun()
    } else {
      setTerminalHistory([...newHistory, { type: 'error', text: `Command not found: ${terminalInput}. Type 'help' for available commands.` }])
    }

    setTerminalInput('')
  }

  const renderFileTree = (items, depth = 0) => {
    return items.map((item) => {
      const isFolder = item.kind === 'folder'
      const isExpanded = expandedFolders[item.id] ?? true
      const isActive = activeFileId === item.id

      return (
        <div key={item.id}>
          <div
            className={`group flex items-center gap-2 px-2 py-1.5 transition-colors ${theme === 'vs-dark'
              ? isActive ? 'bg-[#37373d] text-white' : 'text-gray-300 hover:bg-[#2a2d2e]'
              : isActive ? 'bg-blue-50 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
              }`}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
          >
            <button
              type="button"
              onClick={() => {
                if (isFolder) {
                  toggleFolder(item.id)
                } else {
                  openFile(item.id)
                }
              }}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              {isFolder ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <span className="w-[14px]" />
              )}
              {isFolder ? (
                isExpanded ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />
              ) : (
                <FileText size={16} className="text-slate-400" />
              )}
              <span className="truncate text-sm">{item.name}</span>
            </button>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {isFolder && (
                <>
                  <button
                    type="button"
                    onClick={() => createFile(item.id)}
                    className="rounded p-1 hover:bg-white/10"
                    title="New file"
                  >
                    <FilePlus2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => createFolder(item.id)}
                    className="rounded p-1 hover:bg-white/10"
                    title="New folder"
                  >
                    <FolderPlus size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => renameNode(item.id)}
                className="rounded p-1 hover:bg-white/10"
                title="Rename"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => deleteNode(item.id)}
                className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {isFolder && isExpanded && item.children?.length > 0 && (
            <div>{renderFileTree(item.children, depth + 1)}</div>
          )}
        </div>
      )
    })
  }

  if (roomId === 'new' || loading || authLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 size={42} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-medium text-slate-300">Preparing your collaborative code workspace...</p>
        </div>
      </div>
    )
  }

  if (!documentMeta) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Code workspace unavailable</h2>
          <p className="mt-3 text-sm text-slate-400">
            This shared workspace could not be loaded. Check the URL or create a new code workspace from the dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full min-h-0 flex flex-col overflow-hidden ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      <div className={`${theme === 'vs-dark' ? 'bg-[#323233] border-[#3e3e42]' : 'bg-white border-gray-200'} border-b px-4 py-2.5 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${theme === 'vs-dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Shared Code Workspace
              </p>
              <p className={`truncate text-sm font-semibold ${theme === 'vs-dark' ? 'text-white' : 'text-gray-900'}`}>
                {documentMeta.title || 'Untitled Code Workspace'}
              </p>
            </div>

            <div className={`h-7 w-px ${theme === 'vs-dark' ? 'bg-[#555]' : 'bg-gray-300'}`} />

            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium uppercase tracking-wide ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Language:
              </span>
              <select
                value={currentLanguage}
                onChange={(event) => handleLanguageChange(event.target.value)}
                disabled={!activeFileId}
                className={`px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${theme === 'vs-dark'
                  ? 'bg-[#3c3c3c] text-gray-200 border-[#555] hover:bg-[#464646]'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {languageOptions.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
              className={`p-1.5 rounded-md transition-all ${theme === 'vs-dark'
                ? 'text-yellow-400 hover:bg-[#3c3c3c] hover:text-yellow-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              title={theme === 'vs-dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md ${theme === 'vs-dark' ? 'bg-[#3c3c3c]' : 'bg-gray-100'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {isConnected ? 'Live sync connected' : 'Connecting'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 4).map((collaborator) => (
                  <div
                    key={`${collaborator.clientId || collaborator.id}-${collaborator.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white"
                    style={{ backgroundColor: collaborator.color }}
                    title={collaborator.id === presenceProfile.id ? `${collaborator.name} (You)` : collaborator.name}
                  >
                    {getInitials(collaborator.name)}
                  </div>
                ))}
              </div>
              <div className={`text-xs font-medium ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeCollaborators.length} collaborator{activeCollaborators.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className={`h-6 w-px ${theme === 'vs-dark' ? 'bg-[#555]' : 'bg-gray-300'}`} />

            <button
              onClick={handleRun}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
              title="Run current file"
            >
              <Play size={16} />
              <span>Run</span>
            </button>

            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-md transition-colors ${theme === 'vs-dark'
                ? 'text-gray-400 hover:bg-[#3c3c3c] hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              title="Copy current file"
            >
              <Copy size={18} />
            </button>

            <button
              onClick={handleDownload}
              className={`p-1.5 rounded-md transition-colors ${theme === 'vs-dark'
                ? 'text-gray-400 hover:bg-[#3c3c3c] hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              title="Download current file"
            >
              <Download size={18} />
            </button>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              title="Changes sync automatically"
            >
              <Save size={16} />
              <span>Saved Live</span>
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${theme === 'vs-dark'
                ? 'bg-[#3c3c3c] text-gray-200 border-[#555] hover:bg-[#464646]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              title="Share workspace"
            >
              <Share size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div
            className={`${theme === 'vs-dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-50 border-gray-200'} border-r flex flex-col`}
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center justify-between`}>
              <span>Explorer</span>
              <div className="flex items-center gap-1">
                <button type="button" className="hover:bg-[#2a2d2e] p-1 rounded" onClick={() => createFile()}>
                  <FilePlus2 size={14} />
                </button>
                <button type="button" className="hover:bg-[#2a2d2e] p-1 rounded" onClick={() => createFolder()}>
                  <FolderPlus size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto text-sm">
              {workspaceSnapshot.tree.length > 0 ? (
                renderFileTree(workspaceSnapshot.tree)
              ) : (
                <div className={`px-4 py-6 text-sm ${theme === 'vs-dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  <p>No files yet.</p>
                  <button type="button" onClick={() => createFile()} className="mt-3 inline-flex items-center gap-2 text-blue-400">
                    <FilePlus2 size={14} />
                    <span>Create your first file</span>
                  </button>
                </div>
              )}
            </div>

            <div className={`border-t ${theme === 'vs-dark' ? 'border-[#3e3e42]' : 'border-gray-200'} p-2 flex items-center justify-around`}>
              <button className={`p-2 rounded hover:bg-[#2a2d2e] ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`} title="Search">
                <Search size={18} />
              </button>
              <button className={`p-2 rounded hover:bg-[#2a2d2e] ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`} title="Source Control">
                <GitBranch size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {openFileIds.length > 0 && (
            <div className={`flex items-center ${theme === 'vs-dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-100 border-gray-200'} border-b overflow-x-auto`}>
              {openFileIds.map((fileId) => {
                const file = workspaceSnapshot.byId.get(fileId)

                if (!file) {
                  return null
                }

                const isOpenFileActive = activeFileId === fileId

                return (
                  <div
                    key={fileId}
                    className={`flex items-center space-x-2 px-4 py-2 border-r cursor-pointer ${isOpenFileActive
                      ? theme === 'vs-dark'
                        ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500'
                        : 'bg-white text-gray-900 border-t-2 border-t-blue-500'
                      : theme === 'vs-dark'
                        ? 'bg-[#2d2d30] text-gray-400 hover:bg-[#1e1e1e] border-[#3e3e42]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-50 border-gray-200'
                      }`}
                    onClick={() => openFile(fileId)}
                  >
                    <File size={14} />
                    <span className="text-sm">{file.name}</span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        closeFile(fileId)
                      }}
                      className="hover:bg-[#3e3e42] rounded p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className={`flex-1 overflow-hidden ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`} style={{ height: showBottomPanel ? `calc(100% - ${panelHeight}px)` : '100%' }}>
            {activeFile ? (
              <Editor
                height="100%"
                language={currentLanguage}
                theme={theme}
                onMount={handleEditorDidMount}
                loading={
                  <div className={`h-full flex items-center justify-center ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className={theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}>Loading collaborative editor...</p>
                    </div>
                  </div>
                }
                options={{
                  fontSize,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            ) : (
              <div className={`flex h-full items-center justify-center ${theme === 'vs-dark' ? 'bg-[#1e1e1e] text-gray-400' : 'bg-white text-gray-500'}`}>
                <div className="text-center">
                  <FileText size={34} className="mx-auto opacity-60" />
                  <p className="mt-3 text-sm font-medium">No file selected</p>
                  <button type="button" onClick={() => createFile()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                    <FilePlus2 size={15} />
                    <span>Create file</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {showBottomPanel && (
            <div
              className={`border-t ${theme === 'vs-dark' ? 'bg-[#1e1e1e] border-[#3e3e42]' : 'bg-white border-gray-200'}`}
              style={{ height: `${panelHeight}px` }}
            >
              <div className={`flex items-center justify-between ${theme === 'vs-dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-50 border-gray-200'} border-b px-2`}>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'output'
                      ? theme === 'vs-dark'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-900 border-b-2 border-blue-500'
                      : theme === 'vs-dark'
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <FileOutput size={16} />
                    <span>Output</span>
                    {output.length > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">{output.length}</span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'terminal'
                      ? theme === 'vs-dark'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-900 border-b-2 border-blue-500'
                      : theme === 'vs-dark'
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Terminal size={16} />
                    <span>Terminal</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPanelHeight(panelHeight === 250 ? 400 : 250)}
                    className={`p-1.5 rounded transition-colors ${theme === 'vs-dark'
                      ? 'text-gray-400 hover:bg-[#3c3c3c] hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    title={panelHeight === 250 ? 'Maximize Panel' : 'Minimize Panel'}
                  >
                    {panelHeight === 250 ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </button>
                  <button
                    onClick={() => setShowBottomPanel(false)}
                    className={`p-1.5 rounded transition-colors ${theme === 'vs-dark'
                      ? 'text-gray-400 hover:bg-[#3c3c3c] hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    title="Close Panel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="h-[calc(100%-41px)] overflow-auto">
                {activeTab === 'output' && (
                  <div className={`p-4 font-mono text-sm ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                    {output.length === 0 ? (
                      <div className={`text-center py-8 ${theme === 'vs-dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        <FileOutput size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No local output yet. Click "Run" to execute the current file.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {output.map((item, index) => (
                          <div
                            key={`${item.type}-${index}`}
                            className={`py-1 ${item.type === 'error'
                              ? 'text-red-400'
                              : item.type === 'warn'
                                ? 'text-yellow-400'
                                : item.type === 'success'
                                  ? 'text-green-400'
                                  : item.type === 'info'
                                    ? 'text-blue-400'
                                    : theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}
                          >
                            {item.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'terminal' && (
                  <div className={`h-full flex flex-col ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                    <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                      {terminalHistory.map((item, index) => (
                        <div
                          key={`${item.type}-${index}`}
                          className={`py-0.5 ${item.type === 'input'
                            ? theme === 'vs-dark' ? 'text-green-400' : 'text-green-600'
                            : item.type === 'error'
                              ? 'text-red-400'
                              : item.type === 'system'
                                ? 'text-blue-400'
                                : theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                          {item.text}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleTerminalSubmit} className={`border-t p-2 ${theme === 'vs-dark' ? 'border-[#3e3e42]' : 'border-gray-200'}`}>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm ${theme === 'vs-dark' ? 'text-green-400' : 'text-green-600'}`}>$</span>
                        <input
                          type="text"
                          value={terminalInput}
                          onChange={(event) => setTerminalInput(event.target.value)}
                          className={`flex-1 bg-transparent font-mono text-sm outline-none ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-800'
                            }`}
                          placeholder="Type a command..."
                          autoFocus
                        />
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {!showBottomPanel && (
            <div className={`border-t ${theme === 'vs-dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-50 border-gray-200'} px-2 py-1`}>
              <button
                onClick={() => setShowBottomPanel(true)}
                className={`flex items-center space-x-2 px-3 py-1 text-sm font-medium rounded transition-colors ${theme === 'vs-dark'
                  ? 'text-gray-400 hover:bg-[#3c3c3c] hover:text-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Terminal size={16} />
                <span>Show Output & Terminal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`${theme === 'vs-dark' ? 'bg-[#007acc] text-white' : 'bg-blue-600 text-white'} px-4 py-1 flex items-center justify-between text-xs`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch size={14} />
            <span>live-workspace</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span>{cursorPosition}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="font-semibold">{currentLanguage.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
