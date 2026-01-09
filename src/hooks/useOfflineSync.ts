import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useOfflineStore } from '../stores/offlineStore'
import { calculateNewElo, DEFAULT_ELO } from '../lib/elo'
import { findBestMatch } from '../lib/fuzzyMatch'
import { dishKeys } from './useDishes'
import type { DishEntryData } from '../types'

export function useOfflineSync() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const {
    queue,
    isOnline,
    isSyncing,
    setSyncing,
    removeFromQueue,
    incrementRetry,
    getPendingItems,
  } = useOfflineStore()

  // Process a single dish entry from the queue
  const processDishEntry = useCallback(
    async (data: DishEntryData) => {
      if (!user) throw new Error('Not authenticated')

      // 1. Ensure restaurant exists
      let restaurantId: string

      if (data.isCustomPlace && data.customPlace) {
        // Handle custom place
        const { data: existingCustomPlace } = await supabase
          .from('restaurants')
          .select('*')
          .eq('name', data.customPlace.name)
          .eq('city', data.customPlace.city)
          .eq('is_custom_place', true)
          .eq('created_by', user.id)
          .single()

        if (existingCustomPlace) {
          restaurantId = existingCustomPlace.id
        } else {
          const { data: newRestaurant, error } = await supabase
            .from('restaurants')
            .insert({
              google_place_id: null,
              name: data.customPlace.name,
              city: data.customPlace.city,
              address: data.customPlace.address || null,
              is_closed: false,
              is_custom_place: true,
              place_type: data.customPlace.place_type,
              created_by: user.id,
            })
            .select()
            .single()

          if (error) throw error
          restaurantId = newRestaurant.id
        }
      } else if (data.restaurant) {
        // Handle Google Places restaurant
        const { data: existingRestaurant } = await supabase
          .from('restaurants')
          .select('*')
          .eq('google_place_id', data.restaurant.google_place_id)
          .single()

        if (existingRestaurant) {
          restaurantId = existingRestaurant.id
        } else {
          const { data: newRestaurant, error } = await supabase
            .from('restaurants')
            .insert({
              google_place_id: data.restaurant.google_place_id,
              name: data.restaurant.name,
              city: data.restaurant.city,
              address: data.restaurant.address,
              is_closed: false,
              is_custom_place: false,
              place_type: 'restaurant',
            })
            .select()
            .single()

          if (error) throw error
          restaurantId = newRestaurant.id
        }
      } else {
        throw new Error('No restaurant or custom place provided')
      }

      // 2. Check for existing dish
      const { data: existingDishes } = await supabase
        .from('canonical_dishes')
        .select('id, name')
        .eq('restaurant_id', restaurantId)

      const matchedDish = findBestMatch(data.dishName, existingDishes || [])
      let canonicalDishId: string

      if (matchedDish) {
        canonicalDishId = matchedDish.id
      } else {
        // Create new canonical dish
        const { data: newDish, error } = await supabase
          .from('canonical_dishes')
          .insert({
            restaurant_id: restaurantId,
            name: data.dishName.trim(),
            cuisine_category_id: data.cuisineCategory?.id || null,
            cuisine_subcategory_id: data.cuisineSubcategory?.id || null,
            community_elo: DEFAULT_ELO,
            comparison_count: 0,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) throw error
        canonicalDishId = newDish.id
      }

      // 3. Create user entry (skip photo for offline entries)
      const { error: entryError } = await supabase.from('user_dish_entries').insert({
        user_id: user.id,
        canonical_dish_id: canonicalDishId,
        photo_url: null, // Photos not synced offline
        is_deleted: false,
      })

      if (entryError) throw entryError
    },
    [user]
  )

  // Process a single comparison from the queue
  const processComparison = useCallback(
    async (data: {
      dishAId: string
      dishBId: string
      winnerId: string | null
      skipped: boolean
    }) => {
      if (!user) throw new Error('Not authenticated')

      // Record the comparison
      const { error: comparisonError } = await supabase.from('comparisons').insert({
        user_id: user.id,
        dish_a_id: data.dishAId,
        dish_b_id: data.dishBId,
        winner_id: data.winnerId,
        skipped: data.skipped,
      })

      if (comparisonError) throw comparisonError

      // Update Elo if not skipped
      if (!data.skipped && data.winnerId) {
        const loserId = data.winnerId === data.dishAId ? data.dishBId : data.dishAId

        const { data: dishes } = await supabase
          .from('canonical_dishes')
          .select('id, community_elo, comparison_count')
          .in('id', [data.winnerId, loserId])

        if (dishes && dishes.length === 2) {
          const winner = dishes.find((d) => d.id === data.winnerId)!
          const loser = dishes.find((d) => d.id === loserId)!

          const { newWinnerElo, newLoserElo } = calculateNewElo(
            winner.community_elo,
            loser.community_elo,
            winner.comparison_count,
            loser.comparison_count
          )

          await supabase
            .from('canonical_dishes')
            .update({
              community_elo: newWinnerElo,
              comparison_count: winner.comparison_count + 1,
            })
            .eq('id', data.winnerId)

          await supabase
            .from('canonical_dishes')
            .update({
              community_elo: newLoserElo,
              comparison_count: loser.comparison_count + 1,
            })
            .eq('id', loserId)
        }
      }
    },
    [user]
  )

  // Sync all pending items
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || !user) return

    const pendingItems = getPendingItems()
    if (pendingItems.length === 0) return

    setSyncing(true)

    for (const item of pendingItems) {
      try {
        if (item.type === 'dish_entry') {
          await processDishEntry(item.data as DishEntryData)
        } else if (item.type === 'comparison') {
          await processComparison(
            item.data as {
              dishAId: string
              dishBId: string
              winnerId: string | null
              skipped: boolean
            }
          )
        }

        removeFromQueue(item.id)
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error)
        incrementRetry(item.id)
      }
    }

    setSyncing(false)

    // Refresh data after sync
    queryClient.invalidateQueries({ queryKey: dishKeys.all })
  }, [
    isOnline,
    isSyncing,
    user,
    getPendingItems,
    setSyncing,
    processDishEntry,
    processComparison,
    removeFromQueue,
    incrementRetry,
    queryClient,
  ])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncQueue()
    }
  }, [isOnline, queue.length, isSyncing, syncQueue])

  return {
    pendingCount: queue.length,
    isSyncing,
    isOnline,
    syncQueue,
  }
}
