import { useState } from 'react'
import { useEntryStore } from '../../stores/entryStore'
import { useCuisineCategories, useCuisineSubcategories } from '../../hooks/useDishes'
import { Button, Select } from '../ui'

export function CuisineStep() {
  const { data, setCuisineCategory, setCuisineSubcategory, nextStep, prevStep } = useEntryStore()
  const [selectedCategoryId, setSelectedCategoryId] = useState(data.cuisineCategory?.id || '')

  const { data: categories = [], isLoading: loadingCategories } = useCuisineCategories()
  const { data: subcategories = [], isLoading: loadingSubcategories } =
    useCuisineSubcategories(selectedCategoryId || null)

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value
    setSelectedCategoryId(categoryId)

    const category = categories.find((c) => c.id === categoryId)
    setCuisineCategory(category || null)
    setCuisineSubcategory(null)
  }

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = e.target.value
    const subcategory = subcategories.find((s) => s.id === subcategoryId)
    setCuisineSubcategory(subcategory || null)
  }

  const handleSkip = () => {
    setCuisineCategory(null)
    setCuisineSubcategory(null)
    nextStep()
  }

  const handleContinue = () => {
    nextStep()
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
          What type of food is this?
        </h1>
        <p className="text-gray-500 mb-8">
          This helps with filtering and recommendations. Optional.
        </p>

        <div className="space-y-4">
          <Select
            label="Cuisine Category"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            placeholder="Select a category..."
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            disabled={loadingCategories}
          />

          {selectedCategoryId && (
            <Select
              label="Subcategory (optional)"
              value={data.cuisineSubcategory?.id || ''}
              onChange={handleSubcategoryChange}
              placeholder="Select a subcategory..."
              options={subcategories.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              disabled={loadingSubcategories}
            />
          )}
        </div>

        {/* Quick select chips for common cuisines */}
        {!selectedCategoryId && categories.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3">Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 8).map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategoryId(category.id)
                    setCuisineCategory(category)
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 flex gap-3">
        <Button onClick={handleSkip} variant="secondary" fullWidth size="lg">
          Skip
        </Button>
        <Button onClick={handleContinue} fullWidth size="lg">
          Next
        </Button>
      </div>
    </div>
  )
}
