import { Card } from '../ui'
import { calculateWinRate } from '../../lib/elo'
import type { DishWithDetails } from '../../types'

interface LeaderboardItemProps {
  dish: DishWithDetails
  rank: number
}

export function LeaderboardItem({ dish, rank }: LeaderboardItemProps) {
  // Calculate win rate (mock for now - would need actual wins data)
  const winRate = dish.comparison_count > 0
    ? calculateWinRate(Math.floor(dish.comparison_count * 0.6), dish.comparison_count)
    : 0

  // Get rank medal for top 3
  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  const medal = getMedal(rank)
  const photoUrl = dish.user_entry?.photo_url || null

  return (
    <Card padding="sm" className="flex items-center gap-3">
      {/* Rank */}
      <div className="flex-shrink-0 w-10 text-center">
        {medal ? (
          <span className="text-2xl">{medal}</span>
        ) : (
          <span className="text-lg font-bold text-gray-400">#{rank}</span>
        )}
      </div>

      {/* Photo */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={dish.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-300"
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{dish.name}</h3>
        <p className="text-sm text-gray-500 truncate">
          {dish.restaurant?.name || 'Unknown'} · {dish.restaurant?.city || ''}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {winRate}% win rate
          </span>
          <span>{dish.comparison_count} comparisons</span>
        </div>
      </div>

      {/* Elo score */}
      <div className="flex-shrink-0 text-right">
        <span className="text-lg font-bold text-orange-500">
          {Math.round(dish.community_elo)}
        </span>
        <p className="text-xs text-gray-400">Elo</p>
      </div>
    </Card>
  )
}
