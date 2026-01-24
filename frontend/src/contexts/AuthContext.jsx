import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

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
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (emailOrUsername, password) => {
    try {
      // Check for demo credentials
      if (emailOrUsername === 'Abhinav16' && password === '123456') {
        const demoUser = {
          id: 1,
          email: 'abhinav@togetherhub.com',
          username: 'Abhinav16',
          name: 'Abhinav Pandey',
          avatar: 'https://ui-avatars.com/api/?name=Abhinav+Pandey&background=4f46e5'
        }
        
        localStorage.setItem('user', JSON.stringify(demoUser))
        setUser(demoUser)
        toast.success('Welcome back, Abhinav!')
        return { success: true }
      }
      
      // Regular login simulation
      const mockUser = {
        id: Date.now(),
        email: emailOrUsername,
        name: emailOrUsername.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${emailOrUsername.split('@')[0]}&background=random`
      }
      
      localStorage.setItem('user', JSON.stringify(mockUser))
      setUser(mockUser)
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      toast.error('Login failed')
      return { success: false, error: error.message }
    }
  }

  const signup = async (name, email, password) => {
    try {
      // Simulate API call
      const mockUser = {
        id: Date.now(),
        email,
        name,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
      }
      
      localStorage.setItem('user', JSON.stringify(mockUser))
      setUser(mockUser)
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Signup failed')
      return { success: false, error: error.message }
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
