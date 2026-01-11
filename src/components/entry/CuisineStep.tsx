import { useState } from 'react'
import { useEntryStore } from '../../stores/entryStore'
import { useCuisineCategories, useCuisineSubcategories } from '../../hooks/useDishes'
import { Button, Select } from '../ui'

export function CuisineStep() {
  const {
    data,
    setCuisineCategory,
    setCuisineSubcategory,
    setFusion,
    toggleFusionCategory,
    nextStep,
    prevStep,
  } = useEntryStore()
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

  const handleFusionToggle = () => {
    setFusion(!data.isFusion)
    setSelectedCategoryId('')
  }

  const handleSkip = () => {
    setCuisineCategory(null)
    setCuisineSubcategory(null)
    setFusion(false)
    nextStep()
  }

  const handleContinue = () => {
    nextStep()
  }

  const isFusionCategorySelected = (categoryId: string) => {
    return data.fusionCategories.some((c) => c.id === categoryId)
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
        <p className="text-gray-500 mb-6">
          This helps with filtering and recommendations. Optional.
        </p>

        {/* Fusion toggle */}
        <button
          onClick={handleFusionToggle}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 mb-6 transition-all ${
            data.isFusion
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌏</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Fusion Cuisine</p>
              <p className="text-sm text-gray-500">Select multiple cuisines</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              data.isFusion
                ? 'border-orange-500 bg-orange-500'
                : 'border-gray-300'
            }`}
          >
            {data.isFusion && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Fusion mode - multi-select */}
        {data.isFusion ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Select the cuisines that make up this fusion dish:
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleFusionCategory(category)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    isFusionCategorySelected(category.id)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                  {isFusionCategorySelected(category.id) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
            {data.fusionCategories.length > 0 && (
              <p className="mt-4 text-sm text-gray-600">
                Selected: {data.fusionCategories.map((c) => c.name).join(' × ')}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Regular single cuisine selection */}
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
          </>
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
