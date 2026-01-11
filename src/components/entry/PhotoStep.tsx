import { useRef, useState } from 'react'
import { useEntryStore } from '../../stores/entryStore'
import { Button } from '../ui'

interface PhotoStepProps {
  onComplete: () => void
  isSubmitting: boolean
  error?: string | null
}

export function PhotoStep({ onComplete, isSubmitting, error }: PhotoStepProps) {
  const { data, setPhoto, prevStep } = useEntryStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (file: File | null) => {
    if (!file) return

    // Validate file type - allow images and videos
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    // Validate file size (max 10MB for images, 50MB for videos before compression)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(isVideo
        ? 'Video is too large. Please select a video under 50MB.'
        : 'Image is too large. Please select an image under 10MB.'
      )
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPhoto(file, previewUrl)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0] || null
    handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleRemovePhoto = () => {
    if (data.photoPreview) {
      URL.revokeObjectURL(data.photoPreview)
    }
    setPhoto(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSkip = () => {
    setPhoto(null, null)
    onComplete()
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add a photo</h1>
        <p className="text-gray-500 mb-8">
          A picture is worth a thousand words. Optional but recommended!
        </p>

        {/* Summary of entry */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">You're adding:</p>
          <p className="font-semibold text-gray-900">{data.dishName}</p>
          <p className="text-gray-600">
            {data.isCustomPlace ? data.customPlace?.name : data.restaurant?.name}
          </p>
          {data.isFusion && data.fusionCategories.length > 0 ? (
            <p className="text-sm text-gray-500">
              🌏 {data.fusionCategories.map((c) => c.name).join(' × ')} Fusion
            </p>
          ) : data.cuisineCategory && (
            <p className="text-sm text-gray-500">
              {data.cuisineCategory.name}
              {data.cuisineSubcategory && ` > ${data.cuisineSubcategory.name}`}
            </p>
          )}
        </div>

        {/* Photo/Video upload area */}
        {data.photoPreview ? (
          <div className="relative">
            <div className="aspect-dish overflow-hidden rounded-xl">
              {data.photoFile?.type.startsWith('video/') ? (
                <video
                  src={data.photoPreview}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={data.photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              aspect-dish border-2 border-dashed rounded-xl
              flex flex-col items-center justify-center cursor-pointer
              transition-colors
              ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-gray-600 font-medium">Tap to add a photo</p>
            <p className="text-gray-400 text-sm mt-1">or drag and drop</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      <div className="mt-auto pt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="secondary"
            fullWidth
            size="lg"
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            onClick={onComplete}
            fullWidth
            size="lg"
            isLoading={isSubmitting}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
