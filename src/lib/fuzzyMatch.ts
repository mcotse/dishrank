/**
 * Fuzzy matching for dish name deduplication
 * Uses Fuse.js for fuzzy search
 */

import Fuse from 'fuse.js'
import type { CanonicalDish } from '../types'

const MATCH_THRESHOLD = 0.15 // Lower = stricter matching (0-1 scale, 0 = perfect match)

/**
 * Normalize a dish name for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common words like "the", "a", "with"
 */
export function normalizeDishName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(the|a|an|with|and|&)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find potential duplicate dishes within the same restaurant
 */
export function findPotentialDuplicates(
  newDishName: string,
  existingDishes: Pick<CanonicalDish, 'id' | 'name'>[]
): Array<{ dish: Pick<CanonicalDish, 'id' | 'name'>; score: number }> {
  if (existingDishes.length === 0) {
    return []
  }

  const normalizedNewName = normalizeDishName(newDishName)

  // Check for exact match first
  const exactMatch = existingDishes.find(
    (d) => normalizeDishName(d.name) === normalizedNewName
  )

  if (exactMatch) {
    return [{ dish: exactMatch, score: 0 }]
  }

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(existingDishes, {
    keys: ['name'],
    threshold: MATCH_THRESHOLD,
    includeScore: true,
    ignoreLocation: true,
  })

  const results = fuse.search(newDishName)

  return results
    .filter((r) => r.score !== undefined && r.score <= MATCH_THRESHOLD)
    .map((r) => ({
      dish: r.item,
      score: r.score!,
    }))
}

/**
 * Check if a dish name is likely a duplicate
 * Returns the matching dish if found, null otherwise
 */
export function findBestMatch(
  newDishName: string,
  existingDishes: Pick<CanonicalDish, 'id' | 'name'>[]
): Pick<CanonicalDish, 'id' | 'name'> | null {
  const duplicates = findPotentialDuplicates(newDishName, existingDishes)

  if (duplicates.length > 0) {
    // Return the best match (lowest score = best match)
    return duplicates.sort((a, b) => a.score - b.score)[0].dish
  }

  return null
}

/**
 * Calculate similarity score between two strings (0-1, 1 = identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeDishName(str1)
  const s2 = normalizeDishName(str2)

  if (s1 === s2) return 1

  // Levenshtein distance-based similarity
  const matrix: number[][] = []
  const len1 = s1.length
  const len2 = s2.length

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)

  return maxLen === 0 ? 1 : 1 - distance / maxLen
}
