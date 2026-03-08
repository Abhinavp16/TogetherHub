import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, FileText, Code, PenTool, Clock, Search, UserPlus, Video } from 'lucide-react'
import CreateRoomModal from '../components/UI/CreateRoomModal'
import { roomAPI } from '../services/api'
import toast from 'react-hot-toast'

const RoomList = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRoomForParticipant, setSelectedRoomForParticipant] = useState(null)
  const [participantEmail, setParticipantEmail] = useState('')

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getRooms()
      setRooms(response.data)
    } catch (error) {
      toast.error('Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchRooms()
  }, [])


  const getTypeIcon = (type) => {
    switch (type) {
      case 'document': return FileText
      case 'code': return Code
      case 'whiteboard': return PenTool
      case 'video': return Video
      default: return FileText
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'document': return 'bg-blue-500'
      case 'code': return 'bg-green-500'
      case 'whiteboard': return 'bg-purple-500'
      case 'video': return 'bg-rose-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || room.type === filter
    return matchesSearch && matchesFilter
  })

  const handleAddParticipant = async (roomId) => {
    if (participantEmail.trim()) {
      try {
        await roomAPI.joinRoom(roomId, { email: participantEmail })
        toast.success('Participant added successfully')
        fetchRooms()
      } catch (error) {
        toast.error('Failed to add participant')
      }
      setParticipantEmail('')
      setSelectedRoomForParticipant(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => {
          fetchRooms()
          setIsCreateModalOpen(false)
        }}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Collaboration Rooms</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Manage and join collaborative workspaces with your teams.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#0ea5e9] dark:hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shadow-indigo-500/30 dark:shadow-blue-500/20"
          >
            <Plus size={20} className="mr-2" />
            <span>New Room</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-2xl overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center space-x-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50 shadow-sm transition-all outline-none"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="code">Code</option>
              <option value="whiteboard">Whiteboards</option>
              <option value="video">Video Calls</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-white/5 max-h-[600px] overflow-y-auto">
          {filteredRooms.map((room) => {
            const Icon = getTypeIcon(room.type)
            const colorClass = getTypeColor(room.type)

            return (
              <div key={room._id} className="p-6 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-5">
                    <div className={`${colorClass} p-4 rounded-xl text-white shadow-shadow-sm`}>
                      <Icon size={24} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{room.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-2"></span>
                          Owner: <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">{room.owner?.name || 'Unknown'}</span>
                        </span>
                        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#0b0f19] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                          <Users size={14} className="text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{room.members?.length || 0} participants</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${room.type === 'document' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                        room.type === 'code' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' :
                          room.type === 'whiteboard' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' :
                            'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                      }`}>
                      {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                    </span>

                    <button
                      onClick={() => setSelectedRoomForParticipant(room._id)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-white transition-colors flex items-center space-x-1.5 focus:outline-none font-semibold border border-transparent dark:border-white/5"
                      title="Add participant"
                    >
                      <UserPlus size={16} />
                      <span className="text-sm">Add</span>
                    </button>

                    <Link
                      to={`/${room.type}/${room._id}`}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#0ea5e9] dark:hover:bg-blue-500 text-white rounded-lg transition-colors font-bold shadow-md shadow-slate-900/10 dark:shadow-blue-500/20"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 mb-6 border border-slate-100 dark:border-white/5">
              <Users size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No rooms found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Try adjusting your search or create a new collaborative room.</p>
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      {selectedRoomForParticipant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-[#1a1f2c] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 w-full max-w-md transform transition-all">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserPlus size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Participant</h2>
            </div>

            <div className="mb-6 space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Participant Email Address
              </label>
              <input
                type="email"
                placeholder="colleague@example.com"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddParticipant(selectedRoomForParticipant)
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50 transition-all font-medium"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-3 mt-8">
              <button
                onClick={() => {
                  setSelectedRoomForParticipant(null)
                  setParticipantEmail('')
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-white transition-colors font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddParticipant(selectedRoomForParticipant)}
                disabled={!participantEmail.trim()}
                className="flex-1 px-4 py-3 bg-indigo-600 dark:bg-[#0ea5e9] text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-500 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 dark:shadow-blue-500/20"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomList