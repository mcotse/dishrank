import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserDishes } from '../hooks/useDishes'
import { Layout } from '../components/layout'
import { Button, Card } from '../components/ui'

export function HomePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { data: userDishes = [], isLoading } = useUserDishes()

  const recentDishes = userDishes.slice(0, 5)

  return (
    <Layout title="DishRank">
      <div className="px-4 py-6 space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Hey, {user?.user_metadata?.full_name?.split(' ')[0] || 'Foodie'}!
            </h2>
            <p className="text-gray-500">What are you eating today?</p>
          </div>
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card hoverable onClick={() => navigate('/entry')} className="text-center py-8">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Add Dish</h3>
            <p className="text-sm text-gray-500 mt-1">Log a new dish</p>
          </Card>

          <Card hoverable onClick={() => navigate('/compare')} className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Compare</h3>
            <p className="text-sm text-gray-500 mt-1">Rank your dishes</p>
          </Card>
        </div>

        {/* Stats */}
        <Card>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{userDishes.length}</p>
              <p className="text-sm text-gray-500">Dishes</p>
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {userDishes.reduce((sum, d) => sum + (d.canonical_dish?.comparison_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Comparisons</p>
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(userDishes.map((d) => d.canonical_dish?.restaurant_id)).size}
              </p>
              <p className="text-sm text-gray-500">Restaurants</p>
            </div>
          </div>
        </Card>

        {/* Recent dishes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent Dishes</h3>
            {userDishes.length > 5 && (
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-sm text-orange-500 font-medium"
              >
                View all
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 text-orange-500">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            </div>
          ) : recentDishes.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 mb-4">No dishes yet. Start adding!</p>
              <Button onClick={() => navigate('/entry')} size="sm">
                Add your first dish
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentDishes.map((entry) => (
                <Card key={entry.id} padding="sm" className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {entry.photo_url ? (
                      <img
                        src={entry.photo_url}
                        alt={entry.canonical_dish?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {entry.canonical_dish?.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {entry.canonical_dish?.restaurant?.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-orange-500">
                      {Math.round(entry.canonical_dish?.community_elo || 1200)}
                    </p>
                    <p className="text-xs text-gray-400">Elo</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
