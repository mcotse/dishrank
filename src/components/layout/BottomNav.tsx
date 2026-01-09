import { Link, useLocation } from 'react-router-dom'

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    path: '/entry',
    label: 'Add',
    icon: (active: boolean) => (
      <div
        className={`w-12 h-12 -mt-4 rounded-full flex items-center justify-center ${
          active ? 'bg-orange-500' : 'bg-orange-500'
        } shadow-lg`}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
  },
  {
    path: '/leaderboard',
    label: 'Ranks',
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    path: '/compare',
    label: 'Compare',
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    ),
  },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center min-w-[64px]"
              >
                {item.icon(isActive)}
                <span
                  className={`text-xs mt-1 ${
                    isActive ? 'text-orange-500 font-medium' : 'text-gray-400'
                  } ${item.path === '/entry' ? 'mt-2' : ''}`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
