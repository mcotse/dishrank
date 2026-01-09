import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout'
import { Button } from '../components/ui'
import { CustomPlaceForm } from '../components/entry'
import { useCustomPlaces, useDeletePlace, useCreatePlace, useUpdatePlace } from '../hooks/usePlaces'
import { PLACE_TYPE_ICONS, PLACE_TYPE_LABELS } from '../types'
import type { Restaurant, PlaceType } from '../types'

type ViewMode = 'list' | 'add' | 'edit'

export function ManagePlacesPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingPlace, setEditingPlace] = useState<Restaurant | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: places = [], isLoading } = useCustomPlaces()
  const createPlace = useCreatePlace()
  const updatePlace = useUpdatePlace()
  const deletePlace = useDeletePlace()

  const handleCreate = async (data: {
    name: string
    city: string
    place_type: PlaceType
    address?: string
  }) => {
    try {
      await createPlace.mutateAsync(data)
      setViewMode('list')
    } catch (error) {
      console.error('Failed to create place:', error)
    }
  }

  const handleUpdate = async (data: {
    name: string
    city: string
    place_type: PlaceType
    address?: string
  }) => {
    if (!editingPlace) return
    try {
      await updatePlace.mutateAsync({
        id: editingPlace.id,
        updates: data,
      })
      setEditingPlace(null)
      setViewMode('list')
    } catch (error) {
      console.error('Failed to update place:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePlace.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete place:', error)
    }
  }

  const startEdit = (place: Restaurant) => {
    setEditingPlace(place)
    setViewMode('edit')
  }

  // Add/Edit form view
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <Layout showNav={false}>
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <h1 className="text-xl font-bold text-gray-900 mb-6">
              {viewMode === 'add' ? 'Add Custom Place' : 'Edit Place'}
            </h1>
            <CustomPlaceForm
              onSubmit={viewMode === 'add' ? handleCreate : handleUpdate}
              onCancel={() => {
                setViewMode('list')
                setEditingPlace(null)
              }}
              initialData={
                editingPlace
                  ? {
                      name: editingPlace.name,
                      city: editingPlace.city,
                      place_type: editingPlace.place_type,
                      address: editingPlace.address || undefined,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </Layout>
    )
  }

  // List view
  return (
    <Layout showNav={false}>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">My Places</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24">
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
          ) : places.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No custom places yet</h2>
              <p className="text-gray-500 mb-6">
                Add places like your home, favorite food truck, or pop-up spots.
              </p>
              <Button onClick={() => setViewMode('add')}>Add Your First Place</Button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">
                        {PLACE_TYPE_ICONS[place.place_type]}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {place.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {place.city} · {PLACE_TYPE_LABELS[place.place_type]}
                      </p>
                      {place.address && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {place.address}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(place)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(place.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirm === place.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">
                        Delete this place? Dishes linked to it will remain but show as "Unknown Place".
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDelete(place.id)}
                          isLoading={deletePlace.isPending}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add button */}
        {places.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-100">
            <Button fullWidth onClick={() => setViewMode('add')}>
              Add New Place
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}
