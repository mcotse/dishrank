import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useOfflineSync } from '../../hooks/useOfflineSync'

interface LayoutProps {
  children: ReactNode
  showNav?: boolean
  title?: string
}

export function Layout({ children, showNav = true, title }: LayoutProps) {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium safe-top">
          You're offline. Changes will sync when you're back online.
        </div>
      )}

      {/* Syncing indicator */}
      {isOnline && isSyncing && (
        <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium safe-top flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
          Syncing {pendingCount} item{pendingCount !== 1 ? 's' : ''}...
        </div>
      )}

      {/* Header */}
      {title && (
        <header className="bg-white border-b border-gray-100 px-4 py-3 safe-top">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </header>
      )}

      {/* Main content */}
      <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>{children}</main>

      {/* Bottom navigation */}
      {showNav && <BottomNav />}
    </div>
  )
}
