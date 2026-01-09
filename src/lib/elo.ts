/**
 * Elo Rating System for DishRank
 *
 * Uses dynamic K-factor based on comparison count:
 * - New dishes (< 10 comparisons): K = 40 (high volatility)
 * - Stabilizing (10-30 comparisons): K = 24
 * - Established (30+ comparisons): K = 16
 */

export const DEFAULT_ELO = 1200

/**
 * Get the K-factor based on number of comparisons
 * Higher K = more volatile rating changes
 */
export function getKFactor(comparisonCount: number): number {
  if (comparisonCount < 10) {
    return 40 // New dish, allow fast movement
  } else if (comparisonCount < 30) {
    return 24 // Stabilizing
  } else {
    return 16 // Established, slow changes
  }
}

/**
 * Calculate expected score (probability of winning)
 * Based on standard Elo formula
 */
export function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate new Elo ratings after a comparison
 * Returns new ratings for both dishes
 */
export function calculateNewElo(
  winnerElo: number,
  loserElo: number,
  winnerComparisonCount: number,
  loserComparisonCount: number
): { newWinnerElo: number; newLoserElo: number } {
  const kWinner = getKFactor(winnerComparisonCount)
  const kLoser = getKFactor(loserComparisonCount)

  const expectedWinner = getExpectedScore(winnerElo, loserElo)
  const expectedLoser = 1 - expectedWinner

  // Winner gets points based on how unexpected the win was
  // Loser loses points based on how expected their win was
  const newWinnerElo = winnerElo + kWinner * (1 - expectedWinner)
  const newLoserElo = loserElo + kLoser * (0 - expectedLoser)

  return {
    newWinnerElo: Math.round(newWinnerElo * 10) / 10,
    newLoserElo: Math.round(newLoserElo * 10) / 10,
  }
}

/**
 * Select dishes for comparison using smart bracketing
 * Prioritizes dishes with similar Elo scores for tighter ranking resolution
 */
export function selectComparisonDishes<T extends { id: string; community_elo: number }>(
  targetDish: T,
  allDishes: T[],
  count: number = 1
): T[] {
  // Filter out the target dish
  const candidates = allDishes.filter((d) => d.id !== targetDish.id)

  if (candidates.length === 0) {
    return []
  }

  // Sort by Elo distance from target dish
  const sortedByDistance = [...candidates].sort(
    (a, b) =>
      Math.abs(a.community_elo - targetDish.community_elo) -
      Math.abs(b.community_elo - targetDish.community_elo)
  )

  // Take top 30% closest by Elo (or at least 3 dishes)
  const topCount = Math.max(3, Math.floor(sortedByDistance.length * 0.3))
  const topCandidates = sortedByDistance.slice(0, topCount)

  // Randomly select from top candidates
  const selected: T[] = []
  const available = [...topCandidates]

  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length)
    selected.push(available[randomIndex])
    available.splice(randomIndex, 1)
  }

  return selected
}

/**
 * Calculate win rate for a dish based on comparisons
 */
export function calculateWinRate(wins: number, totalComparisons: number): number {
  if (totalComparisons === 0) return 0
  return Math.round((wins / totalComparisons) * 100)
}

/**
 * Calculate Elo trend (change over a period)
 */
export function calculateTrend(currentElo: number, previousElo: number): number {
  return Math.round((currentElo - previousElo) * 10) / 10
}
