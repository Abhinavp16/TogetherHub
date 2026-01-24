import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { 
  Save, Share, Download, Upload, FileText, History, 
  MessageSquare, Printer, Copy, Undo, Redo, Search,
  FileDown, Eye, EyeOff, ChevronDown
} from 'lucide-react'
import UserPresence from '../components/Collaboration/UserPresence'
import { useCollaboration } from '../hooks/useCollaboration'

const DocumentEditor = () => {
  const { roomId } = useParams()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('Untitled Document')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [versions, setVersions] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const quillRef = useRef()
  
  const { users, isConnected } = useCollaboration(roomId, 'document')

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['10px', '12px', '14px', '16px', '18px', '24px', '32px', '48px'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
  }

  const formats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script', 'list', 'bullet', 'indent',
    'align', 'blockquote', 'code-block', 'link', 'image', 'video'
  ]

  // Calculate word and character count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '').trim()
    setCharCount(text.length)
    setWordCount(text ? text.split(/\s+/).length : 0)
  }, [content])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !content) return
    
    const timer = setTimeout(() => {
      handleSave(true)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [content, title, autoSave])

  const handleContentChange = (value) => {
    setContent(value)
    // TODO: Implement Yjs synchronization
  }

  const handleSave = (isAutoSave = false) => {
    const timestamp = new Date().toISOString()
    const version = {
      id: Date.now(),
      title,
      content,
      timestamp,
      author: 'Current User'
    }
    
    setVersions(prev => [version, ...prev].slice(0, 10))
    setLastSaved(timestamp)
    
    if (!isAutoSave) {
      console.log('Document saved manually:', { title, content })
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportHTML = () => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportMarkdown = () => {
    // Simple HTML to Markdown conversion
    let markdown = content
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportText = () => {
    const text = content.replace(/<[^>]*>/g, '')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setContent(text)
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
  }

  const handleUndo = () => {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      editor.history.undo()
    }
  }

  const handleRedo = () => {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      editor.history.redo()
    }
  }

  const handleCopyContent = () => {
    const text = content.replace(/<[^>]*>/g, '')
    navigator.clipboard.writeText(text)
    alert('Content copied to clipboard!')
  }

  const handleRestoreVersion = (version) => {
    if (confirm('Restore this version? Current changes will be saved as a new version.')) {
      handleSave()
      setContent(version.content)
      setTitle(version.title)
      setShowVersionHistory(false)
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comment = {
      id: Date.now(),
      text: newComment,
      author: 'Current User',
      timestamp: new Date().toISOString()
    }
    
    setComments(prev => [...prev, comment])
    setNewComment('')
  }

  const handleDeleteComment = (id) => {
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleFind = () => {
    const searchTerm = prompt('Search for:')
    if (searchTerm) {
      const editor = quillRef.current?.getEditor()
      if (editor) {
        const text = editor.getText()
        const index = text.toLowerCase().indexOf(searchTerm.toLowerCase())
        if (index !== -1) {
          editor.setSelection(index, searchTerm.length)
        } else {
          alert('Text not found')
        }
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex gap-6 p-6">
      {/* Main Editor */}
      <div className="flex-1">
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 glass-header">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              placeholder="Untitled Document"
            />
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {lastSaved && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              
              <UserPresence users={users} />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center space-x-1">
              <button
                onClick={handleUndo}
                className="p-2.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md"
                title="Undo"
              >
                <Undo size={18} />
              </button>
              <button
                onClick={handleRedo}
                className="p-2.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md"
                title="Redo"
              >
                <Redo size={18} />
              </button>
              
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />
              
              <button
                onClick={handleFind}
                className="p-2.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md"
                title="Find"
              >
                <Search size={18} />
              </button>
              <button
                onClick={handleCopyContent}
                className="p-2.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md"
                title="Copy Content"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={handlePrint}
                className="p-2.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md"
                title="Print"
              >
                <Printer size={18} />
              </button>
              
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />
              
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md"
                title="Statistics"
              >
                {showStats ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-white bg-white dark:bg-slate-600 px-4 py-2 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Auto-save</span>
              </label>
            </div>
          </div>

          {/* Stats Bar */}
          {showStats && (
            <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 dark:text-slate-400">Words:</span>
                <strong className="text-blue-600 dark:text-blue-400 text-base">{wordCount}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 dark:text-slate-400">Characters:</span>
                <strong className="text-blue-600 dark:text-blue-400 text-base">{charCount}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 dark:text-slate-400">Users:</span>
                <strong className="text-blue-600 dark:text-blue-400 text-base">{users.length}</strong>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="p-6 bg-white dark:bg-slate-900" style={{ position: 'relative', zIndex: 1 }}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder="Start writing your document..."
              style={{ minHeight: '500px', position: 'relative' }}
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500 hover:shadow-md transition-all duration-200 font-medium"
              >
                <History size={16} />
                <span>History</span>
              </button>
              
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500 hover:shadow-md transition-all duration-200 font-medium"
              >
                <MessageSquare size={16} />
                <span>Comments ({comments.length})</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <Download size={16} />
                  <span>Export</span>
                  <ChevronDown size={14} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute bottom-full mb-2 left-0 glass-card py-2 min-w-[180px] z-10 shadow-xl">
                    <button
                      onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center space-x-3 text-slate-700 dark:text-white transition-colors duration-150"
                    >
                      <FileDown size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => { handleExportHTML(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center space-x-3 text-slate-700 dark:text-white transition-colors duration-150"
                    >
                      <FileText size={16} className="text-green-600 dark:text-green-400" />
                      <span>HTML</span>
                    </button>
                    <button
                      onClick={() => { handleExportMarkdown(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center space-x-3 text-slate-700 dark:text-white transition-colors duration-150"
                    >
                      <FileDown size={16} className="text-purple-600 dark:text-purple-400" />
                      <span>Markdown</span>
                    </button>
                    <button
                      onClick={() => { handleExportText(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center space-x-3 text-slate-700 dark:text-white transition-colors duration-150"
                    >
                      <FileText size={16} className="text-orange-600 dark:text-orange-400" />
                      <span>Plain Text</span>
                    </button>
                  </div>
                )}
              </div>
              
              <label className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500 hover:shadow-md transition-all duration-200 cursor-pointer font-medium">
                <Upload size={16} />
                <span>Import</span>
                <input
                  type="file"
                  accept=".txt,.html,.md"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSave(false)}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <Share size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Sidebar */}
      {showVersionHistory && (
        <div className="w-80 glass-card p-6 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-modern">
          <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <History size={20} className="text-blue-600 dark:text-blue-400" />
            <span>Version History</span>
          </h3>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <History size={32} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No versions saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-600 dark:hover:to-slate-600 hover:shadow-md cursor-pointer transition-all duration-200"
                  onClick={() => handleRestoreVersion(version)}
                >
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{version.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center space-x-1">
                    <span>📅</span>
                    <span>{new Date(version.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center space-x-1">
                    <span>👤</span>
                    <span>{version.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments Sidebar */}
      {showComments && (
        <div className="w-80 glass-card p-6 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-modern">
          <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
            <span>Comments</span>
          </h3>
          
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              rows="3"
            />
            <button
              onClick={handleAddComment}
              className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              Add Comment
            </button>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{comment.author}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
                      <span>🕒</span>
                      <span>{new Date(comment.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentEditor