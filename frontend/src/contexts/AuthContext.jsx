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

  const persistSession = (token, user) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      const { user, token } = response.data

      persistSession(token, user)
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

      persistSession(token, user)
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const startOAuth = async (provider) => {
    try {
      window.location.assign(authAPI.getOAuthStartUrl(provider))
      return { success: true }
    } catch (error) {
      toast.error(`${provider} login failed`)
      return { success: false, error: error.message }
    }
  }

  const loginWithGoogle = async () => startOAuth('google')

  const loginWithGithub = async () => {
    return startOAuth('github')
  }

  const completeOAuthLogin = (token, user) => {
    persistSession(token, user)
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
      completeOAuthLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
