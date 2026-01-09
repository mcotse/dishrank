import type { LeaderboardFilters as FiltersType, CuisineCategory, SourceFilter } from '../../types'

interface LeaderboardFiltersProps {
  filters: FiltersType
  categories: CuisineCategory[]
  onFilterChange: (filters: Partial<FiltersType>) => void
}

export function LeaderboardFilters({
  filters,
  categories,
  onFilterChange,
}: LeaderboardFiltersProps) {
  const viewModeOptions = [
    { value: 'community', label: 'Community' },
    { value: 'personal', label: 'My Rankings' },
  ]

  const sourceOptions: { value: SourceFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'restaurants', label: 'Restaurants' },
    { value: 'homemade', label: 'Homemade' },
  ]

  const categoryOptions = [
    { value: '', label: 'All Cuisines' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="flex flex-col gap-3">
        {/* Top row: View mode and Source filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {/* View mode pills */}
          <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
            {viewModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  onFilterChange({ viewMode: option.value as FiltersType['viewMode'] })
                }
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${
                    filters.viewMode === option.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Source filter pills */}
          <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ source: option.value })}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${
                    filters.source === option.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row: Cuisine filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {/* Cuisine filter dropdown */}
          <div className="flex-shrink-0 min-w-[140px]">
            <select
              value={filters.cuisineCategoryId || ''}
              onChange={(e) =>
                onFilterChange({
                  cuisineCategoryId: e.target.value || null,
                  cuisineSubcategoryId: null,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          {(filters.cuisineCategoryId || filters.city || filters.source !== 'all') && (
            <button
              onClick={() =>
                onFilterChange({
                  cuisineCategoryId: null,
                  cuisineSubcategoryId: null,
                  city: null,
                  source: 'all',
                })
              }
              className="flex-shrink-0 px-3 py-2 text-sm text-orange-500 font-medium hover:bg-orange-50 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
