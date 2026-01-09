import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, isLoading, isAuthenticated, setLoading, signOut: clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Note: Auth initialization is handled in ProtectedRoute to avoid
  // a deadlock where children don't mount until auth is loaded

  // Sign in with magic link
  const signInWithMagicLink = useCallback(async (email: string) => {
    setLoading(true)
    setAuthError(null)
    setMagicLinkSent(false)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL || '/'}`,
      },
    })

    setLoading(false)

    if (error) {
      console.error('Magic link error:', error)
      setAuthError(error.message)
      return false
    }

    setMagicLinkSent(true)
    return true
  }, [setLoading])

  // Sign in with password (for test accounts)
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setAuthError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      console.error('Password sign in error:', error)
      setAuthError(error.message)
      return false
    }

    return true
  }, [setLoading])

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
    }

    clearAuth()
    navigate('/auth')
  }, [setLoading, clearAuth, navigate])

  return {
    user,
    isLoading,
    isAuthenticated,
    magicLinkSent,
    authError,
    signInWithMagicLink,
    signInWithPassword,
    signOut,
    resetAuthState: () => {
      setMagicLinkSent(false)
      setAuthError(null)
    },
  }
}

// Hook for protecting routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth')
    }
  }, [isAuthenticated, isLoading, navigate])

  return { isAuthenticated, isLoading }
}
