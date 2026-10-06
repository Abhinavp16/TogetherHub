import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import WorkspaceLayout from './components/Layout/WorkspaceLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import RoomList from './pages/RoomList'
import Team from './pages/Team'
import AuthCallback from './pages/AuthCallback'

// Workspace pages pull in heavy editors (Monaco, TipTap, WebRTC), so load them on demand.
const DocumentEditor = lazy(() => import('./pages/DocumentEditor'))
const CodeEditor = lazy(() => import('./pages/CodeEditor'))
const Whiteboard = lazy(() => import('./pages/Whiteboard'))
const MeetingRoom = lazy(() => import('./pages/MeetingRoom'))

const WorkspaceFallback = () => (
  <div className="flex h-full items-center justify-center bg-slate-950">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
  </div>
)

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'glass-card text-slate-800 dark:text-slate-200',
                  style: {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
              <Suspense fallback={<WorkspaceFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Home />} />
                    <Route path="rooms" element={<RoomList />} />
                    <Route path="team" element={<Team />} />
                  </Route>
                  <Route element={
                    <ProtectedRoute>
                      <WorkspaceLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/video/:roomId" element={<MeetingRoom />} />
                  </Route>
                  <Route element={<WorkspaceLayout />}>
                    <Route path="/code/:roomId" element={<CodeEditor />} />
                    <Route path="/document/:roomId" element={<DocumentEditor />} />
                    <Route path="/whiteboard/:roomId" element={<Whiteboard />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
