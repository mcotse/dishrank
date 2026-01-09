import { type ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { supabase, hasValidCredentials } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, setUser } = useAuthStore()

  // Initialize auth state - this MUST run in ProtectedRoute because
  // child components don't mount until isLoading is false
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-orange-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}
