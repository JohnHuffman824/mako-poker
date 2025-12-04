import type { SidePot } from '@mako/shared'

/**
 * Records a contribution to the pot tracking map.
 */
export function recordContribution(
  contributions: Record<number, number>,
  seatIndex: number,
  amount: number
): void {
  contributions[seatIndex] = (contributions[seatIndex] ?? 0) + amount
}

/**
 * Resets contribution tracking for a new hand.
 */
export function resetContributions(
  contributions: Record<number, number>
): void {
  for (const key of Object.keys(contributions)) {
    delete contributions[Number(key)]
  }
}

/**
 * Creates a simple pot (no all-ins).
 */
export function createSimplePot(
  amount: number,
  activeSeats: Set<number>
): SidePot[] {
  return [{
    id: 1,
    amount,
    eligiblePlayerSeats: Array.from(activeSeats),
    capPerPlayer: amount,
    isMainPot: true,
    displayName: 'Main Pot'
  }]
}

/**
 * Calculates side pots for all-in scenarios.
 * Creates separate pots for each all-in level.
 */
export function calculatePots(
  contributions: Record<number, number>,
  activeSeats: Set<number>
): SidePot[] {
  // Filter to only active players' contributions
  const activeContributions: Record<number, number> = {}
  for (const [seat, amount] of Object.entries(contributions)) {
    const seatNum = Number(seat)
    if (activeSeats.has(seatNum)) {
      activeContributions[seatNum] = amount
    }
  }

  // Get unique contribution levels
  const levels = Array.from(
    new Set(Object.values(activeContributions))
  ).sort((a, b) => a - b)

  if (levels.length <= 1) {
    // No side pots needed
    const totalPot = Object.values(contributions).reduce((a, b) => a + b, 0)
    return createSimplePot(totalPot, activeSeats)
  }

  const pots: SidePot[] = []
  let previousLevel = 0
  let potId = 1

  for (const level of levels) {
    const increment = level - previousLevel

    // Find all players who contributed at least this level
    const eligibleSeats = Object.entries(activeContributions)
      .filter(([, amount]) => amount >= level)
      .map(([seat]) => Number(seat))

    if (eligibleSeats.length > 0 && increment > 0) {
      // Also count folded players who contributed to this level
      const totalContributors = Object.entries(contributions)
        .filter(([, amount]) => amount >= level)
        .length

      const potAmount = increment * totalContributors

      pots.push({
        id: potId,
        amount: potAmount,
        eligiblePlayerSeats: eligibleSeats,
        capPerPlayer: level,
        isMainPot: potId === 1,
        displayName: potId === 1 ? 'Main Pot' : `Side Pot ${potId - 1}`
      })
      potId++
    }

    previousLevel = level
  }

  return pots
}

