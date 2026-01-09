import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useOfflineStore } from '../stores/offlineStore'
import { calculateNewElo, selectComparisonDishes } from '../lib/elo'
import { dishKeys } from './useDishes'
import type { DishWithDetails, ComparisonPair } from '../types'

const COMPARISONS_PER_SESSION = 4

interface UseComparisonOptions {
  targetDish?: DishWithDetails
  allDishes: DishWithDetails[]
}

export function useComparison({ targetDish, allDishes }: UseComparisonOptions) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { isOnline, queueComparison } = useOfflineStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [comparisonPairs, setComparisonPairs] = useState<ComparisonPair[]>([])
  const [isComplete, setIsComplete] = useState(false)

  // Generate comparison pairs using smart bracketing
  const generateComparisons = useCallback(() => {
    if (!targetDish || allDishes.length < 2) {
      setComparisonPairs([])
      return
    }

    const opponents = selectComparisonDishes(targetDish, allDishes, COMPARISONS_PER_SESSION)

    const pairs: ComparisonPair[] = opponents.map((opponent) => ({
      dishA: targetDish,
      dishB: opponent,
    }))

    // Randomize which dish appears on which side
    const shuffledPairs = pairs.map((pair) =>
      Math.random() > 0.5 ? pair : { dishA: pair.dishB, dishB: pair.dishA }
    )

    setComparisonPairs(shuffledPairs)
    setCurrentIndex(0)
    setIsComplete(false)
  }, [targetDish, allDishes])

  // Generate comparisons for on-demand ranking (no target dish)
  const generateRandomComparisons = useCallback(() => {
    if (allDishes.length < 2) {
      setComparisonPairs([])
      return
    }

    const pairs: ComparisonPair[] = []
    const usedPairs = new Set<string>()

    for (let i = 0; i < COMPARISONS_PER_SESSION && i < allDishes.length - 1; i++) {
      // Pick a random dish
      const randomIndex = Math.floor(Math.random() * allDishes.length)
      const dishA = allDishes[randomIndex]

      // Find an opponent using smart bracketing
      const opponents = selectComparisonDishes(dishA, allDishes, 3)
      const validOpponent = opponents.find((o) => {
        const pairKey = [dishA.id, o.id].sort().join('-')
        return !usedPairs.has(pairKey)
      })

      if (validOpponent) {
        const pairKey = [dishA.id, validOpponent.id].sort().join('-')
        usedPairs.add(pairKey)

        // Randomize sides
        pairs.push(
          Math.random() > 0.5
            ? { dishA, dishB: validOpponent }
            : { dishA: validOpponent, dishB: dishA }
        )
      }
    }

    setComparisonPairs(pairs)
    setCurrentIndex(0)
    setIsComplete(false)
  }, [allDishes])

  // Submit comparison result mutation
  const submitComparisonMutation = useMutation({
    mutationFn: async ({
      dishAId,
      dishBId,
      winnerId,
      skipped,
    }: {
      dishAId: string
      dishBId: string
      winnerId: string | null
      skipped: boolean
    }) => {
      if (!user) throw new Error('Not authenticated')

      // If offline, queue for later
      if (!isOnline) {
        queueComparison({ dishAId, dishBId, winnerId, skipped })
        return { queued: true }
      }

      // Record the comparison
      const { error: comparisonError } = await supabase.from('comparisons').insert({
        user_id: user.id,
        dish_a_id: dishAId,
        dish_b_id: dishBId,
        winner_id: winnerId,
        skipped,
      })

      if (comparisonError) throw comparisonError

      // Update Elo scores if not skipped
      if (!skipped && winnerId) {
        const loserId = winnerId === dishAId ? dishBId : dishAId

        // Get current dish data
        const { data: dishes } = await supabase
          .from('canonical_dishes')
          .select('id, community_elo, comparison_count')
          .in('id', [winnerId, loserId])

        if (dishes && dishes.length === 2) {
          const winner = dishes.find((d) => d.id === winnerId)!
          const loser = dishes.find((d) => d.id === loserId)!

          const { newWinnerElo, newLoserElo } = calculateNewElo(
            winner.community_elo,
            loser.community_elo,
            winner.comparison_count,
            loser.comparison_count
          )

          // Update winner
          await supabase
            .from('canonical_dishes')
            .update({
              community_elo: newWinnerElo,
              comparison_count: winner.comparison_count + 1,
            })
            .eq('id', winnerId)

          // Update loser
          await supabase
            .from('canonical_dishes')
            .update({
              community_elo: newLoserElo,
              comparison_count: loser.comparison_count + 1,
            })
            .eq('id', loserId)
        }
      }

      return { queued: false }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dishKeys.all })
    },
  })

  // Handle selecting a winner
  const selectWinner = useCallback(
    async (winnerId: string) => {
      const currentPair = comparisonPairs[currentIndex]
      if (!currentPair) return

      await submitComparisonMutation.mutateAsync({
        dishAId: currentPair.dishA.id,
        dishBId: currentPair.dishB.id,
        winnerId,
        skipped: false,
      })

      if (currentIndex < comparisonPairs.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        setIsComplete(true)
      }
    },
    [comparisonPairs, currentIndex, submitComparisonMutation]
  )

  // Handle skip
  const skip = useCallback(async () => {
    const currentPair = comparisonPairs[currentIndex]
    if (!currentPair) return

    await submitComparisonMutation.mutateAsync({
      dishAId: currentPair.dishA.id,
      dishBId: currentPair.dishB.id,
      winnerId: null,
      skipped: true,
    })

    if (currentIndex < comparisonPairs.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [comparisonPairs, currentIndex, submitComparisonMutation])

  const currentPair = comparisonPairs[currentIndex] || null
  const progress = comparisonPairs.length > 0 ? (currentIndex + 1) / comparisonPairs.length : 0

  return {
    currentPair,
    currentIndex,
    totalComparisons: comparisonPairs.length,
    progress,
    isComplete,
    isSubmitting: submitComparisonMutation.isPending,

    generateComparisons,
    generateRandomComparisons,
    selectWinner,
    skip,
    reset: () => {
      setCurrentIndex(0)
      setIsComplete(false)
      setComparisonPairs([])
    },
  }
}
