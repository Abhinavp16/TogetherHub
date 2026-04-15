import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeOAuthLogin } = useAuth()

  useEffect(() => {
    const error = searchParams.get('error')
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')

    if (error) {
      toast.error(error)
      navigate('/login', { replace: true })
      return
    }

    if (!token || !userParam) {
      toast.error('OAuth login could not be completed')
      navigate('/login', { replace: true })
      return
    }

    try {
      const user = JSON.parse(userParam)
      completeOAuthLogin(token, user)
      toast.success(`Welcome, ${user.name}!`)
      navigate('/', { replace: true })
    } catch (parseError) {
      toast.error('OAuth response was invalid')
      navigate('/login', { replace: true })
    }
  }, [completeOAuthLogin, navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Authenticating</p>
        <h1 className="mt-3 text-2xl font-semibold">Finalizing your sign-in...</h1>
      </div>
    </div>
  )
}

export default AuthCallback
