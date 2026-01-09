import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, hasValidCredentials } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, signOut: clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Initialize auth state from Supabase session
  useEffect(() => {
    // Check for auth errors in URL hash (from failed magic link)
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      const errorDesc = params.get('error_description')
      if (errorDesc) {
        setAuthError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
      }
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname)
      setUser(null)
      return
    }

    // If no valid credentials, skip Supabase and go to auth
    if (!hasValidCredentials) {
      setUser(null)
      return
    }

    let mounted = true

    // Set a timeout to handle slow responses
    const timeout = setTimeout(() => {
      if (mounted) {
        setUser(null)
      }
    }, 3000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        clearTimeout(timeout)
        setUser(session?.user ?? null)
      }
    }).catch(() => {
      if (mounted) {
        clearTimeout(timeout)
        setUser(null)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [setUser])

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
