import { useState } from 'react'
import { useLeaderboard, useCuisineCategories } from '../../hooks/useDishes'
import { LeaderboardItem } from './LeaderboardItem'
import { LeaderboardFilters } from './LeaderboardFilters'
import type { LeaderboardFilters as FiltersType } from '../../types'

export function LeaderboardList() {
  const [filters, setFilters] = useState<FiltersType>({
    cuisineCategoryId: null,
    cuisineSubcategoryId: null,
    city: null,
    viewMode: 'community',
  })

  const { data: dishes = [], isLoading, error } = useLeaderboard(filters)
  const { data: categories = [] } = useCuisineCategories()

  const handleFilterChange = (newFilters: Partial<FiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load leaderboard</p>
          <p className="text-gray-500 text-sm">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Filters */}
      <LeaderboardFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 text-orange-500">
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
      )}

      {/* Empty state */}
      {!isLoading && dishes.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No dishes yet</h2>
          <p className="text-gray-500">
            {filters.cuisineCategoryId || filters.city
              ? 'No dishes match your filters. Try adjusting them.'
              : 'Start adding dishes to see them ranked here.'}
          </p>
        </div>
      )}

      {/* Dish list */}
      {!isLoading && dishes.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3">
            {dishes.map((dish, index) => (
              <LeaderboardItem key={dish.id} dish={dish} rank={index + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
