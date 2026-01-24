import { Users } from 'lucide-react'

const UserPresence = ({ users = [] }) => {
  // Mock users for demonstration
  const mockUsers = [
    { id: '1', name: 'Abhinav Pandey', avatar: 'AP', color: '#3b82f6' },
    { id: '2', name: 'Aditya', avatar: 'AD', color: '#10b981' },
    { id: '3', name: 'Vijay', avatar: 'VJ', color: '#f59e0b' }
  ]

  const displayUsers = users.length > 0 ? users : mockUsers

  return (
    <div className="flex items-center space-x-2">
      <div className="flex -space-x-2">
        {displayUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.avatar}
          </div>
        ))}
        {displayUsers.length > 3 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
            +{displayUsers.length - 3}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-1 text-sm text-gray-500">
        <Users size={16} />
        <span>{displayUsers.length}</span>
      </div>
    </div>
  )
}

export default UserPresence