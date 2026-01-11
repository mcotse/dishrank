import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Restaurant, PlaceType } from '../types'

// Fetch user's custom places
export function useCustomPlaces() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['customPlaces', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_custom_place', true)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Restaurant[]
    },
    enabled: !!user?.id,
  })
}

// Fetch user's saved homes specifically
export function useSavedHomes() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['savedHomes', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_custom_place', true)
        .eq('place_type', 'home')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Restaurant[]
    },
    enabled: !!user?.id,
  })
}

// Create a new custom place
export function useCreatePlace() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (place: {
      name: string
      city: string
      place_type: PlaceType
      address?: string
      photo_url?: string
    }) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: place.name,
          city: place.city,
          place_type: place.place_type,
          address: place.address || null,
          photo_url: place.photo_url || null,
          is_custom_place: true,
          is_closed: false,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as Restaurant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPlaces'] })
    },
  })
}

// Update a custom place
export function useUpdatePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: {
        name?: string
        city?: string
        place_type?: PlaceType
        address?: string
        photo_url?: string
      }
    }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .eq('is_custom_place', true)
        .select()
        .single()

      if (error) throw error
      return data as Restaurant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPlaces'] })
    },
  })
}

// Delete a custom place
export function useDeletePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)
        .eq('is_custom_place', true)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPlaces'] })
    },
  })
}
