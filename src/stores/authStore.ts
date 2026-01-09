import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthState {
  user: SupabaseUser | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: SupabaseUser | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'dishrank-auth',
      partialize: (state) => ({
        // Only persist user ID, not full user object
        user: state.user ? { id: state.user.id } : null,
      }),
    }
  )
)
