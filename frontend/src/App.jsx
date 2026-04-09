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
import DocumentEditor from './pages/DocumentEditor'
import CodeEditor from './pages/CodeEditor'
import Whiteboard from './pages/Whiteboard'
import MeetingRoom from './pages/MeetingRoom'
import RoomList from './pages/RoomList'
import Team from './pages/Team'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
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
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
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
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
