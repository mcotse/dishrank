import { useState, useEffect, useCallback } from 'react'
import { useEntryStore } from '../../stores/entryStore'
import { Input } from '../ui'
import {
  searchRestaurants,
  getPlaceDetails,
  extractCityFromPlace,
  loadGoogleMapsScript,
  isPlacesApiAvailable,
} from '../../lib/places'
import { CustomPlaceForm } from './CustomPlaceForm'
import type { PlacePrediction, PlaceType } from '../../types'

export function RestaurantStep() {
  const { data, setRestaurant, setCustomPlace, nextStep, prevStep } = useEntryStore()
  const [showCustomPlaceForm, setShowCustomPlaceForm] = useState(false)
  const [showHomeForm, setShowHomeForm] = useState(false)
  const [homeCity, setHomeCity] = useState('')
  const [query, setQuery] = useState(data.restaurant?.name || '')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApiReady, setIsApiReady] = useState(isPlacesApiAvailable())
  const [error, setError] = useState('')

  // Load Google Maps API
  useEffect(() => {
    if (!isApiReady) {
      loadGoogleMapsScript()
        .then(() => setIsApiReady(true))
        .catch((err) => {
          console.error('Failed to load Google Maps:', err)
          setError('Restaurant search unavailable. Please enter manually.')
        })
    }
  }, [isApiReady])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2 || !isApiReady) {
      setPredictions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await searchRestaurants(query)
        setPredictions(results)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, isApiReady])

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      setIsLoading(true)
      setError('')

      try {
        const details = await getPlaceDetails(prediction.place_id)
        if (details) {
          const city = extractCityFromPlace(details)
          setRestaurant({
            google_place_id: details.place_id,
            name: details.name,
            city,
            address: details.formatted_address,
          })
          setQuery(details.name)
          setPredictions([])
          nextStep()
        }
      } catch (err) {
        console.error('Failed to get place details:', err)
        setError('Failed to get restaurant details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [setRestaurant, nextStep]
  )

  const handleManualEntry = () => {
    if (!query.trim()) {
      setError('Please enter a restaurant name')
      return
    }
    // Manual entry without Place ID
    setRestaurant({
      google_place_id: `manual_${Date.now()}`,
      name: query.trim(),
      city: 'Unknown',
      address: '',
    })
    nextStep()
  }

  const handleCustomPlaceSubmit = (placeData: {
    name: string
    city: string
    place_type: PlaceType
    address?: string
  }) => {
    setCustomPlace({
      name: placeData.name,
      city: placeData.city,
      place_type: placeData.place_type,
      address: placeData.address,
    })
    setShowCustomPlaceForm(false)
    nextStep()
  }

  const handleHomeSubmit = () => {
    if (!homeCity.trim()) {
      setError('Please enter your city')
      return
    }
    setCustomPlace({
      name: 'Home Cooking',
      city: homeCity.trim(),
      place_type: 'home',
    })
    setShowHomeForm(false)
    nextStep()
  }

  // Show custom place form
  if (showCustomPlaceForm) {
    return (
      <div className="flex-1 flex flex-col px-6 py-8">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <CustomPlaceForm
            onSubmit={handleCustomPlaceSubmit}
            onCancel={() => setShowCustomPlaceForm(false)}
          />
        </div>
      </div>
    )
  }

  // Show simplified home cooking form
  if (showHomeForm) {
    return (
      <div className="flex-1 flex flex-col px-6 py-8">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <button
            onClick={() => setShowHomeForm(false)}
            className="flex items-center gap-1 text-gray-500 mb-6 -ml-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <span className="text-4xl mb-4 block">🏠</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Home Cooking
            </h2>
            <p className="text-gray-500 text-sm">
              Just need to know your city
            </p>
          </div>

          <Input
            label="City"
            placeholder="e.g., San Francisco"
            value={homeCity}
            onChange={(e) => {
              setHomeCity(e.target.value)
              setError('')
            }}
            error={error}
            autoFocus
          />

          <div className="mt-auto pt-6">
            <button
              onClick={handleHomeSubmit}
              disabled={!homeCity.trim()}
              className="w-full py-3.5 px-6 bg-orange-500 text-white text-lg font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <button
          onClick={prevStep}
          className="flex items-center gap-1 text-gray-500 mb-6 -ml-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Where did you eat it?
        </h1>
        <p className="text-gray-500 mb-8">
          Search for the restaurant or enter it manually.
        </p>

        <div className="relative">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setError('')
            }}
            placeholder="Search restaurants..."
            error={error}
            autoFocus
            autoComplete="off"
            className="text-lg"
          />

          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
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
            </div>
          )}
        </div>

        {/* Predictions list */}
        {predictions.length > 0 && (
          <ul className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
            {predictions.map((prediction) => (
              <li key={prediction.place_id}>
                <button
                  onClick={() => handleSelect(prediction)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex flex-col border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-900">
                    {prediction.structured_formatting.main_text}
                  </span>
                  <span className="text-sm text-gray-500">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Manual entry option */}
        {!isApiReady && query.trim() && (
          <button
            onClick={handleManualEntry}
            className="mt-4 text-orange-500 font-medium"
          >
            Continue with "{query}" manually
          </button>
        )}

        {/* Quick place options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Not a restaurant?
          </p>

          {/* Home Cooking - prominent button */}
          <button
            onClick={() => setShowHomeForm(true)}
            className="w-full flex items-center gap-3 py-3 px-4 bg-orange-50 border-2 border-orange-200 rounded-xl text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-colors mb-3"
          >
            <span className="text-2xl">🏠</span>
            <span className="font-medium">Home Cooking</span>
          </button>

          {/* Other custom places */}
          <button
            onClick={() => setShowCustomPlaceForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Other (food truck, pop-up, etc.)
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <p className="text-center text-sm text-gray-400 mb-4">
          Powered by Google Places
        </p>
      </div>
    </div>
  )
}
