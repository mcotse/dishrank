import { Card, CardImage } from '../ui'
import type { DishWithDetails } from '../../types'

interface ComparisonCardProps {
  dish: DishWithDetails
  onSelect: () => void
  disabled?: boolean
}

export function ComparisonCard({ dish, onSelect, disabled }: ComparisonCardProps) {
  // Get photo URL from user entry if available
  const photoUrl = dish.user_entry?.photo_url || null

  return (
    <Card
      hoverable={!disabled}
      padding="none"
      className={`
        flex-1 overflow-hidden
        ${disabled ? 'opacity-50' : ''}
        active:scale-[0.98] transition-transform
      `}
      onClick={disabled ? undefined : onSelect}
      data-testid="comparison-card"
    >
      {/* Photo */}
      <CardImage src={photoUrl} alt={dish.name} />

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{dish.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-1">
          {dish.restaurant?.name || 'Unknown restaurant'}
        </p>
        {dish.restaurant?.city && (
          <p className="text-xs text-gray-400 mt-0.5">{dish.restaurant.city}</p>
        )}
      </div>
    </Card>
  )
}
