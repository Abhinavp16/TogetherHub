import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || API_BASE_URL.replace(/\/api$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent redirecting on failed login attempts
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Document API
export const documentAPI = {
  getDocument: (id) => api.get(`/documents/${id}`),
  createDocument: (data) => api.post('/documents', data),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  getDocuments: () => api.get('/documents')
}

export const publicDocumentAPI = {
  getDocument: (id) => api.get(`/public/documents/${id}`),
  updateDocument: (id, data) => api.patch(`/public/documents/${id}`, data)
}

export const publicCodeAPI = {
  getDocument: (id) => api.get(`/public/code/${id}`),
  updateDocument: (id, data) => api.patch(`/public/code/${id}`, data)
}

export const publicWhiteboardAPI = {
  getDocument: (id) => api.get(`/public/whiteboards/${id}`),
  updateDocument: (id, data) => api.patch(`/public/whiteboards/${id}`, data)
}

// Room API
export const roomAPI = {
  getRooms: () => api.get('/rooms'),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms', data),
  addInvite: (id, data) => api.post(`/rooms/${id}/invites`, data),
  addTeamInvites: (id, data) => api.post(`/rooms/${id}/team-invites`, data),
  joinRoom: (id, data = {}) => api.post(`/rooms/${id}/join`, data),
  leaveRoom: (id) => api.post(`/rooms/${id}/leave`)
}

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  getMe: () => api.get('/auth/me'),
  getOAuthStartUrl: (provider) => `${SERVER_BASE_URL}/api/auth/${provider}/start`
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsers: () => api.get('/users')
}

export const teamAPI = {
  getTeams: () => api.get('/teams'),
  getTeam: (id) => api.get(`/teams/${id}`),
  createTeam: (data) => api.post('/teams', data),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  updateMember: (id, userId, data) => api.patch(`/teams/${id}/members/${userId}`, data),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`)
}

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary')
}

export const getCollaborationUrl = () => {
  if (import.meta.env.VITE_COLLAB_URL) {
    return import.meta.env.VITE_COLLAB_URL
  }

  try {
    const url = new URL(SERVER_BASE_URL)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.port = import.meta.env.VITE_COLLAB_PORT || '1234'
    url.pathname = ''
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    return 'ws://localhost:1234'
  }
}

export default api
export { API_BASE_URL, SERVER_BASE_URL }
