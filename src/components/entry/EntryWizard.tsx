import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntryStore } from '../../stores/entryStore'
import { useCreateDish } from '../../hooks/useDishes'
import { DishNameStep } from './DishNameStep'
import { RestaurantStep } from './RestaurantStep'
import { CuisineStep } from './CuisineStep'
import { PhotoStep } from './PhotoStep'

export function EntryWizard() {
  const navigate = useNavigate()
  const { currentStep, data, reset } = useEntryStore()
  const createDish = useCreateDish()
  const [error, setError] = useState<string | null>(null)

  // Reset wizard on mount
  useEffect(() => {
    reset()
  }, [reset])

  const handleComplete = async () => {
    setError(null)

    // Validate required data before submitting
    if (!data.dishName?.trim()) {
      setError('Please enter a dish name')
      return
    }

    if (!data.restaurant && !data.isCustomPlace) {
      setError('Please select a restaurant or add a custom place')
      return
    }

    if (data.isCustomPlace && !data.customPlace) {
      setError('Please complete the custom place details')
      return
    }

    try {
      const result = await createDish.mutateAsync(data)

      if (result.queued) {
        // Offline - show success and go home
        navigate('/')
      } else {
        // Online - go to comparison flow
        navigate('/compare', {
          state: { newDishId: result.canonicalDish?.id },
        })
      }
    } catch (err) {
      console.error('Failed to create dish:', err)
      const message = err instanceof Error ? err.message : 'Failed to save dish. Please try again.'
      setError(message)
    }
  }

  // Progress indicator
  const steps = ['dish', 'restaurant', 'cuisine', 'photo'] as const
  const currentStepIndex = steps.indexOf(currentStep as (typeof steps)[number])
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col">
        {currentStep === 'dish' && <DishNameStep />}
        {currentStep === 'restaurant' && <RestaurantStep />}
        {currentStep === 'cuisine' && <CuisineStep />}
        {currentStep === 'photo' && (
          <PhotoStep
            onComplete={handleComplete}
            isSubmitting={createDish.isPending}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
