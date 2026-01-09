import { type ReactNode, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { supabase, hasValidCredentials } from '../../lib/supabase'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider initializes the authentication state at the app level.
 * This ensures auth is checked regardless of which route the user visits.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    // Check for auth errors in URL hash (from failed magic link)
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      const errorDesc = params.get('error_description')
      if (errorDesc) {
        console.error('Auth error:', decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
      }
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname)
      setUser(null)
      return
    }

    // If no valid credentials, skip Supabase and set as not authenticated
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

  return <>{children}</>
}
