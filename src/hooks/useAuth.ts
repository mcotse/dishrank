import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, signOut: clearAuth } = useAuthStore()
  const navigate = useNavigate()

  // Initialize auth state from Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser])

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      console.error('Google sign-in error:', error)
      setLoading(false)
    }
  }, [setLoading])

  // Sign in with Apple
  const signInWithApple = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      console.error('Apple sign-in error:', error)
      setLoading(false)
    }
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
    signInWithGoogle,
    signInWithApple,
    signOut,
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
