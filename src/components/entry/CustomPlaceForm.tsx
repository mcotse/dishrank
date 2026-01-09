import { useState } from 'react'
import { Button, Input } from '../ui'
import { PLACE_TYPE_LABELS, PLACE_TYPE_ICONS } from '../../types'
import type { PlaceType } from '../../types'

interface CustomPlaceFormProps {
  onSubmit: (data: {
    name: string
    city: string
    place_type: PlaceType
    address?: string
  }) => void
  onCancel: () => void
  initialData?: {
    name?: string
    city?: string
    place_type?: PlaceType
    address?: string
  }
}

const PLACE_TYPES: PlaceType[] = ['home', 'food_truck', 'popup', 'other']

export function CustomPlaceForm({ onSubmit, onCancel, initialData }: CustomPlaceFormProps) {
  const [placeType, setPlaceType] = useState<PlaceType>(initialData?.place_type || 'home')
  const [name, setName] = useState(initialData?.name || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [address, setAddress] = useState(initialData?.address || '')
  const [step, setStep] = useState<'type' | 'details'>('type')

  const handleSubmit = () => {
    if (name.trim() && city.trim()) {
      onSubmit({
        name: name.trim(),
        city: city.trim(),
        place_type: placeType,
        address: address.trim() || undefined,
      })
    }
  }

  if (step === 'type') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            What type of place?
          </h2>
          <p className="text-gray-500 text-sm">
            Select the type that best describes this location
          </p>
        </div>

        <div className="space-y-3">
          {PLACE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setPlaceType(type)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                placeType === type
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{PLACE_TYPE_ICONS[type]}</span>
              <span className="font-medium text-gray-900">
                {PLACE_TYPE_LABELS[type]}
              </span>
              {placeType === type && (
                <svg
                  className="w-5 h-5 text-orange-500 ml-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} fullWidth>
            Cancel
          </Button>
          <Button onClick={() => setStep('details')} fullWidth>
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full mb-4">
          <span>{PLACE_TYPE_ICONS[placeType]}</span>
          <span className="text-sm font-medium text-gray-700">
            {PLACE_TYPE_LABELS[placeType]}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Name this place
        </h2>
        <p className="text-gray-500 text-sm">
          Give it a name you'll remember
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Place name"
          placeholder="e.g., Mom's Kitchen, Taco Truck on 5th"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="City"
          placeholder="e.g., San Francisco"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <Input
          label="Address (optional)"
          placeholder="For your reference"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('type')} fullWidth>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          fullWidth
          disabled={!name.trim() || !city.trim()}
        >
          Done
        </Button>
      </div>
    </div>
  )
}
