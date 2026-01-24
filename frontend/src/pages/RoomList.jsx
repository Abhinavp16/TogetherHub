import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, FileText, Code, PenTool, Clock, Search, UserPlus } from 'lucide-react'
import CreateRoomModal from '../components/UI/CreateRoomModal'

const RoomList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRoomForParticipant, setSelectedRoomForParticipant] = useState(null)
  const [participantEmail, setParticipantEmail] = useState('')

  // Mock data - replace with actual API calls
  const rooms = [
    {
      id: '1',
      name: 'Project Documentation',
      type: 'document',
      participants: 3,
      lastActivity: '2 hours ago',
      owner: 'Abhinav Pandey'
    },
    {
      id: '2',
      name: 'React Components',
      type: 'code',
      participants: 2,
      lastActivity: '1 day ago',
      owner: 'John Doe'
    },
    {
      id: '3',
      name: 'System Architecture',
      type: 'whiteboard',
      participants: 5,
      lastActivity: '3 hours ago',
      owner: 'Jane Smith'
    },
    {
      id: '4',
      name: 'API Documentation',
      type: 'document',
      participants: 1,
      lastActivity: '5 minutes ago',
      owner: 'Abhinav Pandey'
    }
  ]

  const getTypeIcon = (type) => {
    switch (type) {
      case 'document': return FileText
      case 'code': return Code
      case 'whiteboard': return PenTool
      default: return FileText
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'document': return 'bg-blue-500'
      case 'code': return 'bg-green-500'
      case 'whiteboard': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || room.type === filter
    return matchesSearch && matchesFilter
  })

  const handleAddParticipant = (roomId) => {
    if (participantEmail.trim()) {
      // Here you would call your API to add the participant
      console.log(`Adding ${participantEmail} to room ${roomId}`)
      setParticipantEmail('')
      setSelectedRoomForParticipant(null)
      // You can add a toast notification here
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <CreateRoomModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Collaboration Rooms</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and join collaborative workspaces</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition shadow-lg hover:shadow-xl font-medium"
          >
            <Plus size={20} />
            <span>New Room</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="code">Code</option>
              <option value="whiteboard">Whiteboards</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-hidden">
          {filteredRooms.map((room) => {
            const Icon = getTypeIcon(room.type)
            const colorClass = getTypeColor(room.type)
            
            return (
              <div key={room.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${colorClass} p-3 rounded-lg text-white`}>
                      <Icon size={20} />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">{room.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Owner: {room.owner}</span>
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{room.participants} participants</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{room.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      room.type === 'document' ? 'bg-blue-100 text-blue-800' :
                      room.type === 'code' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {room.type}
                    </span>
                    
                    <button
                      onClick={() => setSelectedRoomForParticipant(room.id)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                      title="Add participant"
                    >
                      <UserPlus size={16} />
                      <span className="text-sm font-medium">Add</span>
                    </button>
                    
                    <Link
                      to={`/${room.type}/${room.id}`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Users size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms found</h3>
            <p className="text-gray-500">Try adjusting your search or create a new room</p>
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      {selectedRoomForParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex items-center space-x-2 mb-4">
              <UserPlus size={24} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Add Participant</h2>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="participant@example.com"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddParticipant(selectedRoomForParticipant)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedRoomForParticipant(null)
                  setParticipantEmail('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddParticipant(selectedRoomForParticipant)}
                disabled={!participantEmail.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomList