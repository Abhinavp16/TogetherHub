import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Code, Palette, Users, Clock, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchAPI } from '../../services/api'

const ICONS = { document: FileText, code: Code, whiteboard: Palette, video: Video }

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Searches the user's real workspaces and rooms; an empty query shows recent items.
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await searchAPI.search(query.trim())
        if (!cancelled) {
          setResults(
            response.data.results.map((item) => ({
              ...item,
              icon: ICONS[item.type] || Users
            }))
          )
          setSelectedIndex(0)
        }
      } catch {
        if (!cancelled) {
          setResults([])
        }
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (item) => {
    navigate(item.path)
    onClose()
    setQuery('')
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'document': return 'text-blue-600 dark:text-blue-400'
      case 'code': return 'text-green-600 dark:text-green-400'
      case 'whiteboard': return 'text-purple-600 dark:text-purple-400'
      case 'video': return 'text-rose-600 dark:text-rose-400'
      default: return 'text-slate-600 dark:text-slate-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl animate-bounce-in">
        {/* Search Input */}
        <div className="flex items-center p-4 border-b border-white/20 dark:border-slate-700/30">
          <Search size={20} className="text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search rooms, documents, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 dark:hover:bg-slate-800/20 rounded-lg transition-colors duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto scrollbar-modern">
          {results.length > 0 ? (
            <div className="p-2">
              {!query && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Recent
                </div>
              )}
              {results.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                      index === selectedIndex
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-white/20 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={18} className={getTypeColor(item.type)} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {item.kind === 'room' ? `${item.type} room` : `${item.type} workspace`}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      <Clock size={12} className="inline mr-1" />
                      2h ago
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try searching for rooms, documents, or collaborators</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-white/20 dark:border-slate-700/30 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded mr-1">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center">
              <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded mr-1">Enter</kbd>
              Select
            </span>
            <span className="flex items-center">
              <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded mr-1">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchModal
