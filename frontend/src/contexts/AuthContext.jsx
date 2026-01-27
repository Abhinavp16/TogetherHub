import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const response = await authAPI.getMe()
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      const { user, token } = response.data

      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      toast.success(`Welcome back, ${user.name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup({ name, email, password })
      const { user, token } = response.data

      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const loginWithGoogle = async () => {
    try {
      // Simulate OAuth login
      const mockUser = {
        id: Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
        avatar: 'https://ui-avatars.com/api/?name=Google+User&background=4285f4',
        provider: 'google'
      }

      localStorage.setItem('user', JSON.stringify(mockUser))
      setUser(mockUser)
      toast.success('Logged in with Google!')
      return { success: true }
    } catch (error) {
      toast.error('Google login failed')
      return { success: false, error: error.message }
    }
  }

  const loginWithGithub = async () => {
    try {
      // Simulate OAuth login
      const mockUser = {
        id: Date.now(),
        email: 'user@github.com',
        name: 'GitHub User',
        avatar: 'https://ui-avatars.com/api/?name=GitHub+User&background=24292e',
        provider: 'github'
      }

      localStorage.setItem('user', JSON.stringify(mockUser))
      setUser(mockUser)
      toast.success('Logged in with GitHub!')
      return { success: true }
    } catch (error) {
      toast.error('GitHub login failed')
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      loginWithGoogle,
      loginWithGithub,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
