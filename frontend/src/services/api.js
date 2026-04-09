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

// Room API
export const roomAPI = {
  getRooms: () => api.get('/rooms'),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms', data),
  joinRoom: (id, data = {}) => api.post(`/rooms/${id}/join`, data),
  leaveRoom: (id) => api.post(`/rooms/${id}/leave`)
}

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  getMe: () => api.get('/auth/me')
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsers: () => api.get('/users')
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
