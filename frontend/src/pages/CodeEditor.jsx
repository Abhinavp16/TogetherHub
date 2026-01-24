import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  Save, Share, Download, Copy, Play, Moon, Sun, Terminal, FileOutput, X, Maximize2, Minimize2,
  FileText, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, File, Search, GitBranch
} from 'lucide-react'
import UserPresence from '../components/Collaboration/UserPresence'
import { useCollaboration } from '../hooks/useCollaboration'

const CodeEditor = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(`// Welcome to Together Hub Code Editor


function greet(name) {
  console.log(\`Hello, \${name}! 👋\`);
  return \`Welcome to the editor!\`;
}

const message = greet("Developer");
console.log(message);


// Supported: JavaScript, Python, Java, C++, and more!`)
  const [language, setLanguage] = useState('javascript')
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
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [openFiles, setOpenFiles] = useState([
    { id: 1, name: 'main.js', language: 'javascript', active: true }
  ])
  const [fileTree, setFileTree] = useState([
    {
      id: 1,
      name: 'src',
      type: 'folder',
      expanded: true,
      children: [
        { id: 2, name: 'main.js', type: 'file', language: 'javascript' },
        { id: 3, name: 'utils.js', type: 'file', language: 'javascript' },
        { id: 4, name: 'styles.css', type: 'file', language: 'css' },
      ]
    },
    {
      id: 5,
      name: 'public',
      type: 'folder',
      expanded: false,
      children: [
        { id: 6, name: 'index.html', type: 'file', language: 'html' },
      ]
    },
    { id: 7, name: 'package.json', type: 'file', language: 'json' },
    { id: 8, name: 'README.md', type: 'file', language: 'markdown' },
  ])
  const editorRef = useRef(null)

  // Generate a new room ID if "new" is passed
  useEffect(() => {
    if (roomId === 'new') {
      const newRoomId = `code-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      navigate(`/code/${newRoomId}`, { replace: true })
    }
  }, [roomId, navigate])

  const { users, isConnected } = useCollaboration(roomId !== 'new' ? roomId : null, 'code')

  // Don't render until we have a valid roomId
  if (roomId === 'new') {
    console.log('Redirecting from "new" to generated room ID...')
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating room...</p>
        </div>
      </div>
    )
  }

  console.log('Rendering CodeEditor with roomId:', roomId)

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'sql', label: 'SQL' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'markdown', label: 'Markdown' },
  ]

  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')
  }

  const toggleFolder = (folderId) => {
    const updateTree = (items) => {
      return items.map(item => {
        if (item.id === folderId && item.type === 'folder') {
          return { ...item, expanded: !item.expanded }
        }
        if (item.children) {
          return { ...item, children: updateTree(item.children) }
        }
        return item
      })
    }
    setFileTree(updateTree(fileTree))
  }

  const openFile = (file) => {
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles([...openFiles.map(f => ({ ...f, active: false })), { ...file, active: true }])
    } else {
      setOpenFiles(openFiles.map(f => ({ ...f, active: f.id === file.id })))
    }
    setLanguage(file.language)
  }

  const closeFile = (fileId) => {
    const newFiles = openFiles.filter(f => f.id !== fileId)
    if (newFiles.length > 0 && openFiles.find(f => f.id === fileId)?.active) {
      newFiles[newFiles.length - 1].active = true
    }
    setOpenFiles(newFiles)
  }

  const renderFileTree = (items, depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        {item.type === 'folder' ? (
          <>
            <div
              onClick={() => toggleFolder(item.id)}
              className={`flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-[#2a2d2e] ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {item.expanded ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />}
              <span className="text-sm">{item.name}</span>
            </div>
            {item.expanded && item.children && (
              <div>{renderFileTree(item.children, depth + 1)}</div>
            )}
          </>
        ) : (
          <div
            onClick={() => openFile(item)}
            className={`flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-[#2a2d2e] ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
          >
            <FileText size={16} className="text-gray-400" />
            <span className="text-sm">{item.name}</span>
          </div>
        )}
      </div>
    ))
  }

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
    console.log('Monaco Editor mounted successfully')
  }

  const handleCodeChange = (value) => {
    setCode(value)
    // TODO: Implement Yjs synchronization
  }

  const handleSave = () => {
    console.log('Saving code...', { language, code })
    // TODO: Implement save functionality
  }

  const handleDownload = () => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      markdown: 'md',
    }

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extensions[language] || 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const handleRun = () => {
    setShowBottomPanel(true)
    setActiveTab('output')
    setOutput([])

    const timestamp = new Date().toLocaleTimeString()

    try {
      // Capture console output
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

      setOutput([{ type: 'info', message: `[${timestamp}] Running ${language} code...` }])

      if (language === 'javascript') {
        // Execute JavaScript code
        eval(code)

        // Restore console
        console.log = originalLog
        console.error = originalError
        console.warn = originalWarn

        if (logs.length > 0) {
          setOutput(prev => [...prev, ...logs, { type: 'success', message: `[${timestamp}] Execution completed successfully.` }])
        } else {
          setOutput(prev => [...prev, { type: 'success', message: `[${timestamp}] Code executed successfully (no output).` }])
        }
      } else {
        setOutput(prev => [...prev, { type: 'warn', message: `Code execution for ${language} is not supported in browser. Use the terminal or external compiler.` }])
      }
    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', message: `Error: ${error.message}` }])
    }
  }

  const handleTerminalSubmit = (e) => {
    e.preventDefault()
    if (!terminalInput.trim()) return

    const newHistory = [...terminalHistory, { type: 'input', text: `$ ${terminalInput}` }]

    // Simple command handling
    if (terminalInput === 'clear') {
      setTerminalHistory([{ type: 'system', text: 'Terminal cleared.' }])
    } else if (terminalInput === 'help') {
      setTerminalHistory([...newHistory,
      { type: 'output', text: 'Available commands:' },
      { type: 'output', text: '  clear  - Clear terminal' },
      { type: 'output', text: '  help   - Show this help' },
      { type: 'output', text: '  run    - Run the code' }
      ])
    } else if (terminalInput === 'run') {
      setTerminalHistory([...newHistory, { type: 'output', text: 'Running code...' }])
      handleRun()
    } else {
      setTerminalHistory([...newHistory, { type: 'error', text: `Command not found: ${terminalInput}. Type 'help' for available commands.` }])
    }

    setTerminalInput('')
  }

  return (
    <div className={`-m-8 h-[calc(100vh-64px)] flex flex-col ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      {/* Top Toolbar */}
      <div className={`${theme === 'vs-dark' ? 'bg-[#323233] border-[#3e3e42]' : 'bg-white border-gray-200'} border-b px-4 py-2 flex-shrink-0`}>
        <div className="flex items-center justify-between">
          {/* Left Section - Language & Theme */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium uppercase tracking-wide ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Language:
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${theme === 'vs-dark'
                  ? 'bg-[#3c3c3c] text-gray-200 border-[#555] hover:bg-[#464646]'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={`h-6 w-px ${theme === 'vs-dark' ? 'bg-[#555]' : 'bg-gray-300'}`}></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-md transition-all ${theme === 'vs-dark'
                ? 'text-yellow-400 hover:bg-[#3c3c3c] hover:text-yellow-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              title={theme === 'vs-dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md ${theme === 'vs-dark' ? 'bg-[#3c3c3c]' : 'bg-gray-100'
              }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <UserPresence users={users} />

            <div className={`h-6 w-px ${theme === 'vs-dark' ? 'bg-[#555]' : 'bg-gray-300'}`}></div>

            {/* Action Buttons */}
            <button
              onClick={handleRun}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
              title="Run Code"
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
              title="Copy Code"
            >
              <Copy size={18} />
            </button>

            <button
              onClick={handleDownload}
              className={`p-1.5 rounded-md transition-colors ${theme === 'vs-dark'
                ? 'text-gray-400 hover:bg-[#3c3c3c] hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              title="Download File"
            >
              <Download size={18} />
            </button>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              title="Save Code"
            >
              <Save size={16} />
              <span>Save</span>
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${theme === 'vs-dark'
                ? 'bg-[#3c3c3c] text-gray-200 border-[#555] hover:bg-[#464646]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              title="Share Room"
            >
              <Share size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        {showSidebar && (
          <div
            className={`${theme === 'vs-dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-50 border-gray-200'} border-r flex flex-col`}
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Sidebar Header */}
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center justify-between`}>
              <span>Explorer</span>
              <button className="hover:bg-[#2a2d2e] p-1 rounded">
                <Plus size={14} />
              </button>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto text-sm">
              {renderFileTree(fileTree)}
            </div>

            {/* Sidebar Footer */}
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

        {/* Editor and Bottom Panel Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Open Files Tabs */}
          {openFiles.length > 0 && (
            <div className={`flex items-center ${theme === 'vs-dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-100 border-gray-200'} border-b overflow-x-auto`}>
              {openFiles.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center space-x-2 px-4 py-2 border-r cursor-pointer ${file.active
                      ? theme === 'vs-dark'
                        ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500'
                        : 'bg-white text-gray-900 border-t-2 border-t-blue-500'
                      : theme === 'vs-dark'
                        ? 'bg-[#2d2d30] text-gray-400 hover:bg-[#1e1e1e] border-[#3e3e42]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-50 border-gray-200'
                    }`}
                  onClick={() => openFile(file)}
                >
                  <File size={14} />
                  <span className="text-sm">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeFile(file.id)
                    }}
                    className="hover:bg-[#3e3e42] rounded p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Code Editor */}
          <div className={`flex-1 overflow-hidden ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`} style={{ height: showBottomPanel ? `calc(100% - ${panelHeight}px)` : '100%' }}>
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              loading={
                <div className={`h-full flex items-center justify-center ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}>Loading editor...</p>
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
                formatOnType: true,
              }}
            />
          </div>

          {/* Bottom Panel - Output & Terminal */}
          {showBottomPanel && (
            <div
              className={`border-t ${theme === 'vs-dark' ? 'bg-[#1e1e1e] border-[#3e3e42]' : 'bg-white border-gray-200'}`}
              style={{ height: `${panelHeight}px` }}
            >
              {/* Panel Header with Tabs */}
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

              {/* Panel Content */}
              <div className="h-[calc(100%-41px)] overflow-auto">
                {/* Output Tab */}
                {activeTab === 'output' && (
                  <div className={`p-4 font-mono text-sm ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                    {output.length === 0 ? (
                      <div className={`text-center py-8 ${theme === 'vs-dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        <FileOutput size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No output yet. Click "Run" to execute your code.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {output.map((item, index) => (
                          <div
                            key={index}
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

                {/* Terminal Tab */}
                {activeTab === 'terminal' && (
                  <div className={`h-full flex flex-col ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                    <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                      {terminalHistory.map((item, index) => (
                        <div
                          key={index}
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
                          onChange={(e) => setTerminalInput(e.target.value)}
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

          {/* Show Panel Button (when hidden) */}
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

      {/* Status Bar */}
      <div className={`${theme === 'vs-dark' ? 'bg-[#007acc] text-white' : 'bg-blue-600 text-white'} px-4 py-1 flex items-center justify-between text-xs`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch size={14} />
            <span>main</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="font-semibold">{language.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
