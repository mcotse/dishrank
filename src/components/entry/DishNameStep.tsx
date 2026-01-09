import { useState } from 'react'
import { useEntryStore } from '../../stores/entryStore'
import { Button, Input } from '../ui'

export function DishNameStep() {
  const { data, setDishName, nextStep } = useEntryStore()
  const [localName, setLocalName] = useState(data.dishName)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Auto-capitalize first letter of each word
    const capitalized = value.replace(/\b\w/g, (char) => char.toUpperCase())
    setLocalName(capitalized)
    setError('')
  }

  const handleContinue = () => {
    const trimmed = localName.trim()
    if (!trimmed) {
      setError('Please enter a dish name')
      return
    }
    if (trimmed.length < 2) {
      setError('Dish name is too short')
      return
    }
    setDishName(trimmed)
    nextStep()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContinue()
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          What did you eat today?
        </h1>
        <p className="text-gray-500 mb-8">
          Enter the name of the dish you want to rank.
        </p>

        <Input
          value={localName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Margherita Pizza"
          error={error}
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          spellCheck
          className="text-lg"
        />
      </div>

      <div className="mt-auto pt-6">
        <Button
          onClick={handleContinue}
          fullWidth
          size="lg"
          disabled={!localName.trim()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
