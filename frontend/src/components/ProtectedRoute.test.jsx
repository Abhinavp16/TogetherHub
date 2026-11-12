import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <p>Secret dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )

describe('ProtectedRoute', () => {
  beforeEach(() => vi.mocked(useAuth).mockReset())

  it('shows a loading state while the session is being checked', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: true })
    renderAt()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to login when there is no user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false })
    renderAt()
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })

  it('renders the protected content for a signed-in user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '1', name: 'Demo' }, loading: false })
    renderAt()
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
  })
})
