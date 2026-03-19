import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Users
} from 'lucide-react'
import Logo from '../components/UI/Logo'

const cards = [
  {
    title: 'Live team flow',
    description: 'Pick up active rooms, comments, and drafts without losing context.',
    icon: Users,
    previewClass: 'auth-preview-media auth-preview-media--workspace'
  },
  {
    title: 'Context in one place',
    description: 'Keep messages, edits, and decisions visible beside the work.',
    icon: MessageSquare,
    previewClass: 'auth-preview-media auth-preview-media--activity'
  }
]

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle, loginWithGithub } = useAuth()
  const navigate = useNavigate()

  const fillDemoCredentials = () => {
    setEmail('Abhinav16')
    setPassword('123456')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      navigate('/')
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const result = await loginWithGoogle()
    setLoading(false)
    if (result.success) {
      navigate('/')
    }
  }

  const handleGithubLogin = async () => {
    setLoading(true)
    const result = await loginWithGithub()
    setLoading(false)
    if (result.success) {
      navigate('/')
    }
  }

  return (
    <div className="auth-login-page">
      <div className="auth-login-shell">
        <section className="auth-login-showcase">
          <Logo size="large" className="auth-login-brand" />

          <div className="auth-login-copy">
            <div className="auth-login-badge">
              <ShieldCheck size={16} />
              <span>Built for focused, real-time collaboration</span>
            </div>

            <h1>Work together with clarity, not tab chaos.</h1>
            <p>
              Bring documents, code reviews, and planning boards into one focused workspace
              so your team can move faster without losing context.
            </p>
          </div>

          <div className="auth-preview-grid">
            {cards.map((card) => {
              const Icon = card.icon

              return (
                <article key={card.title} className="auth-preview-card">
                  <div className={card.previewClass}>
                    <div className="auth-preview-float auth-preview-float--one" />
                    <div className="auth-preview-float auth-preview-float--two" />
                    <div className="auth-preview-ui">
                      <div className="auth-preview-ui__top">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="auth-preview-ui__body">
                        <div className="auth-preview-ui__sidebar" />
                        <div className="auth-preview-ui__content">
                          <div className="auth-preview-ui__line auth-preview-ui__line--lg" />
                          <div className="auth-preview-ui__line" />
                          <div className="auth-preview-ui__line auth-preview-ui__line--sm" />
                        </div>
                      </div>
                    </div>
                    <div className="auth-preview-icon">
                      <Icon size={18} />
                    </div>
                  </div>

                  <div className="auth-preview-content">
                    <h2>{card.title}</h2>
                    <p>{card.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="auth-login-form-wrap">
          <div className="auth-login-form-panel">
            <div className="auth-login-form-header">
              <Logo size="medium" showText={false} className="auth-login-form-logo" />
              <h2>Welcome Back</h2>
              <p>Sign in to continue to Together Hub</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-login-form">
              <div className="auth-form-group">
                <label>Username / Email</label>
                <div className="auth-input-wrap">
                  <Mail size={20} className="auth-input-icon" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Username or email"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <Lock size={20} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-input-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-actions">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="auth-demo-button"
                >
                  Use Demo Credentials
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit-button"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider">
              <span>Or continue with</span>
            </div>

            <div className="auth-social-grid">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="auth-social-button"
              >
                <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                onClick={handleGithubLogin}
                disabled={loading}
                className="auth-social-button"
              >
                <Github size={18} className="auth-social-icon auth-social-icon--mono" />
                <span>GitHub</span>
              </button>
            </div>

            <p className="auth-signup-copy">
              Don&apos;t have an account?{' '}
              <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
