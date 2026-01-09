import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useComparison } from '../../hooks/useComparison'
import { useUserDishes } from '../../hooks/useDishes'
import { ComparisonCard } from './ComparisonCard'
import { Button } from '../ui'
import type { DishWithDetails } from '../../types'

export function ComparisonView() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: userDishesData } = useUserDishes()

  // Extract canonical dishes from user entries
  const allDishes: DishWithDetails[] =
    userDishesData?.map((entry) => entry.canonical_dish as DishWithDetails) || []

  // Get the newly added dish if coming from entry flow
  const newDishId = (location.state as { newDishId?: string })?.newDishId
  const targetDish = newDishId ? allDishes.find((d) => d.id === newDishId) : undefined

  const {
    currentPair,
    currentIndex,
    totalComparisons,
    progress,
    isComplete,
    isSubmitting,
    generateComparisons,
    generateRandomComparisons,
    selectWinner,
    skip,
    reset,
  } = useComparison({
    targetDish,
    allDishes,
  })

  // Generate comparisons on mount
  useEffect(() => {
    if (allDishes.length >= 2) {
      if (targetDish) {
        generateComparisons()
      } else {
        generateRandomComparisons()
      }
    }
  }, [allDishes.length, targetDish, generateComparisons, generateRandomComparisons])

  // Not enough dishes to compare
  if (allDishes.length < 2) {
    return (
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
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Not enough dishes</h2>
        <p className="text-gray-500 mb-6">
          Add at least 2 dishes to start comparing and ranking them.
        </p>
        <Button onClick={() => navigate('/entry')}>Add a Dish</Button>
      </div>
    )
  }

  // Comparison complete
  if (isComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Rankings updated!</h2>
        <p className="text-gray-500 mb-6">
          Your comparisons have been recorded and the leaderboard has been updated.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/leaderboard')}>
            View Leaderboard
          </Button>
          <Button
            onClick={() => {
              reset()
              generateRandomComparisons()
            }}
          >
            Compare More
          </Button>
        </div>
      </div>
    )
  }

  // No comparisons generated
  if (!currentPair) {
    return (
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
    )
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>
            {currentIndex + 1} of {totalComparisons}
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
        Would you rather eat...
      </h2>

      {/* Comparison cards */}
      <div className="flex-1 flex gap-3 mb-6">
        <ComparisonCard
          dish={currentPair.dishA}
          onSelect={() => selectWinner(currentPair.dishA.id)}
          disabled={isSubmitting}
        />
        <ComparisonCard
          dish={currentPair.dishB}
          onSelect={() => selectWinner(currentPair.dishB.id)}
          disabled={isSubmitting}
        />
      </div>

      {/* Skip button */}
      <Button variant="ghost" onClick={skip} disabled={isSubmitting} fullWidth>
        Skip this one
      </Button>
    </div>
  )
}
