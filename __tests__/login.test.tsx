import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import LoginPage from '@/app/login/page'
import { supabase } from '@/lib/supabase/client'

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.getByText('Continue with your Google account to proceed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument()
  })

  it('handles OAuth error correctly', async () => {
    const mockError = new Error('OAuth failed')
    const mockSignIn = (supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: mockError,
    })

    // Mock alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<LoginPage />)
    
    const signInButton = screen.getByRole('button', { name: 'Sign in with Google' })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('OAuth failed')
    })

    expect(signInButton).not.toBeDisabled()
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('handles network error correctly', async () => {
    const mockError = new Error('Network error')
    const mockSignIn = (supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockRejectedValue(mockError)

    // Mock alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<LoginPage />)
    
    const signInButton = screen.getByRole('button', { name: 'Sign in with Google' })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Network error')
    })

    expect(signInButton).not.toBeDisabled()
  })

  it('calls OAuth with correct parameters', async () => {
    const mockSignIn = (supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {},
      error: null,
    })

    render(<LoginPage />)
    
    const signInButton = screen.getByRole('button', { name: 'Sign in with Google' })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1)
      expect(mockSignIn).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.send',
        },
      })
    })
  })
})
