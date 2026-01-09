import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useOfflineStore } from '../stores/offlineStore'
import { findBestMatch } from '../lib/fuzzyMatch'
import { DEFAULT_ELO } from '../lib/elo'
import imageCompression from 'browser-image-compression'
import type {
  DishEntryData,
  CanonicalDish,
  DishWithDetails,
  Restaurant,
  CuisineCategory,
  CuisineSubcategory,
  LeaderboardFilters,
} from '../types'

// Query keys
export const dishKeys = {
  all: ['dishes'] as const,
  lists: () => [...dishKeys.all, 'list'] as const,
  list: (filters: LeaderboardFilters) => [...dishKeys.lists(), filters] as const,
  details: () => [...dishKeys.all, 'detail'] as const,
  detail: (id: string) => [...dishKeys.details(), id] as const,
  userDishes: (userId: string) => [...dishKeys.all, 'user', userId] as const,
  restaurantDishes: (restaurantId: string) => [...dishKeys.all, 'restaurant', restaurantId] as const,
}

export const cuisineKeys = {
  categories: ['cuisineCategories'] as const,
  subcategories: (categoryId: string) => ['cuisineSubcategories', categoryId] as const,
}

// Fetch leaderboard dishes
export function useLeaderboard(filters: LeaderboardFilters) {
  return useQuery({
    queryKey: dishKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('canonical_dishes')
        .select(`
          *,
          restaurant:restaurants(*),
          cuisine_category:cuisine_categories(*),
          cuisine_subcategory:cuisine_subcategories(*)
        `)
        .order('community_elo', { ascending: false })
        .limit(50)

      if (filters.cuisineCategoryId) {
        query = query.eq('cuisine_category_id', filters.cuisineCategoryId)
      }

      if (filters.cuisineSubcategoryId) {
        query = query.eq('cuisine_subcategory_id', filters.cuisineSubcategoryId)
      }

      if (filters.city) {
        query = query.eq('restaurant.city', filters.city)
      }

      const { data, error } = await query

      if (error) throw error
      return data as DishWithDetails[]
    },
  })
}

// Fetch user's dishes
export function useUserDishes() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: dishKeys.userDishes(user?.id || ''),
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('user_dish_entries')
        .select(`
          *,
          canonical_dish:canonical_dishes(
            *,
            restaurant:restaurants(*),
            cuisine_category:cuisine_categories(*),
            cuisine_subcategory:cuisine_subcategories(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

// Fetch cuisine categories
export function useCuisineCategories() {
  return useQuery({
    queryKey: cuisineKeys.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuisine_categories')
        .select('*')
        .order('name')

      if (error) throw error
      return data as CuisineCategory[]
    },
  })
}

// Fetch cuisine subcategories
export function useCuisineSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: cuisineKeys.subcategories(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) return []

      const { data, error } = await supabase
        .from('cuisine_subcategories')
        .select('*')
        .eq('parent_id', categoryId)
        .order('name')

      if (error) throw error
      return data as CuisineSubcategory[]
    },
    enabled: !!categoryId,
  })
}

// Create dish entry mutation
export function useCreateDish() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { isOnline, queueDishEntry } = useOfflineStore()

  return useMutation({
    mutationFn: async (entryData: DishEntryData) => {
      if (!user) throw new Error('Not authenticated')

      // If offline, queue for later
      if (!isOnline) {
        queueDishEntry(entryData)
        return { queued: true }
      }

      // 1. Ensure restaurant exists
      let restaurant: Restaurant

      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('google_place_id', entryData.restaurant!.google_place_id)
        .single()

      if (existingRestaurant) {
        restaurant = existingRestaurant
      } else {
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            google_place_id: entryData.restaurant!.google_place_id,
            name: entryData.restaurant!.name,
            city: entryData.restaurant!.city,
            address: entryData.restaurant!.address,
            is_closed: false,
          })
          .select()
          .single()

        if (restaurantError) throw restaurantError
        restaurant = newRestaurant
      }

      // 2. Check for existing dish at this restaurant (fuzzy match)
      const { data: existingDishes } = await supabase
        .from('canonical_dishes')
        .select('id, name')
        .eq('restaurant_id', restaurant.id)

      const matchedDish = findBestMatch(entryData.dishName, existingDishes || [])

      let canonicalDish: CanonicalDish

      if (matchedDish) {
        // Link to existing dish
        const { data, error } = await supabase
          .from('canonical_dishes')
          .select('*')
          .eq('id', matchedDish.id)
          .single()

        if (error) throw error
        canonicalDish = data
      } else {
        // Create new canonical dish
        // Get cuisine average Elo for cold start
        let startingElo = DEFAULT_ELO

        if (entryData.cuisineSubcategory) {
          const { data: avgData } = await supabase
            .from('canonical_dishes')
            .select('community_elo')
            .eq('cuisine_subcategory_id', entryData.cuisineSubcategory.id)

          if (avgData && avgData.length > 0) {
            startingElo = avgData.reduce((sum, d) => sum + d.community_elo, 0) / avgData.length
          }
        } else if (entryData.cuisineCategory) {
          const { data: avgData } = await supabase
            .from('canonical_dishes')
            .select('community_elo')
            .eq('cuisine_category_id', entryData.cuisineCategory.id)

          if (avgData && avgData.length > 0) {
            startingElo = avgData.reduce((sum, d) => sum + d.community_elo, 0) / avgData.length
          }
        }

        const { data: newDish, error: dishError } = await supabase
          .from('canonical_dishes')
          .insert({
            restaurant_id: restaurant.id,
            name: entryData.dishName.trim(),
            cuisine_category_id: entryData.cuisineCategory?.id || null,
            cuisine_subcategory_id: entryData.cuisineSubcategory?.id || null,
            community_elo: startingElo,
            comparison_count: 0,
            created_by: user.id,
          })
          .select()
          .single()

        if (dishError) throw dishError
        canonicalDish = newDish
      }

      // 3. Upload photo if provided
      let photoUrl: string | null = null

      if (entryData.photoFile) {
        // Compress image
        const compressedFile = await imageCompression(entryData.photoFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })

        const fileName = `${user.id}/${canonicalDish.id}/${Date.now()}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('dish-photos')
          .upload(fileName, compressedFile, {
            contentType: 'image/jpeg',
          })

        if (uploadError) {
          console.error('Photo upload error:', uploadError)
        } else {
          const { data: urlData } = supabase.storage
            .from('dish-photos')
            .getPublicUrl(fileName)

          photoUrl = urlData.publicUrl
        }
      }

      // 4. Create user dish entry
      const { data: userEntry, error: entryError } = await supabase
        .from('user_dish_entries')
        .insert({
          user_id: user.id,
          canonical_dish_id: canonicalDish.id,
          photo_url: photoUrl,
          is_deleted: false,
        })
        .select()
        .single()

      if (entryError) throw entryError

      return {
        queued: false,
        canonicalDish,
        userEntry,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishKeys.all })
    },
  })
}

// Delete (soft delete) user dish entry
export function useDeleteDishEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('user_dish_entries')
        .update({ is_deleted: true })
        .eq('id', entryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishKeys.all })
    },
  })
}
