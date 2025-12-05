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
 * Filters contribution map to include only active players.
 * Removes contributions from players who have folded or are otherwise inactive.
 */
function filterActiveContributions(
	contributions: Record<number, number>,
	activeSeats: Set<number>
): Record<number, number> {
	const activeContributions: Record<number, number> = {}
	for (const [seat, amount] of Object.entries(contributions)) {
		const seatNum = Number(seat)
		if (activeSeats.has(seatNum)) {
			activeContributions[seatNum] = amount
		}
	}
	return activeContributions
}

/**
 * Calculates the amount for a pot at a specific contribution level.
 * Includes contributions from both active and folded players who contributed to this level.
 *
 * @param level - The contribution level being processed
 * @param previousLevel - The previous contribution level (for calculating increment)
 * @param contributions - All contributions including folded players
 * @returns The pot amount for this level
 */
function calculatePotAmountForLevel(
	level: number,
	previousLevel: number,
	contributions: Record<number, number>
): number {
	const increment = level - previousLevel
	const totalContributors = Object.entries(contributions)
		.filter(([, amount]) => amount >= level)
		.length
	return increment * totalContributors
}

/**
 * Finds all active players eligible to win a pot at a specific contribution level.
 * Only includes players who are still in the hand (not folded) and contributed at least the level amount.
 */
function findEligibleSeatsForLevel(
	level: number,
	activeContributions: Record<number, number>
): number[] {
	return Object.entries(activeContributions)
		.filter(([, amount]) => amount >= level)
		.map(([seat]) => Number(seat))
}

/**
 * Creates a side pot object with all required properties.
 */
function createPot(
	potId: number,
	amount: number,
	eligibleSeats: number[],
	capPerPlayer: number
): SidePot {
	return {
		id: potId,
		amount,
		eligiblePlayerSeats: eligibleSeats,
		capPerPlayer,
		isMainPot: potId === 1,
		displayName: potId === 1 ? 'Main Pot' : `Side Pot ${potId - 1}`
	}
}

/**
 * Calculates side pots for all-in scenarios.
 * Creates separate pots for each all-in level, ensuring only eligible players
 * can win each pot based on their contribution level.
 */
export function calculatePots(
	contributions: Record<number, number>,
	activeSeats: Set<number>
): SidePot[] {
	const activeContributions = filterActiveContributions(
		contributions,
		activeSeats
	)

	const levels = Array.from(
		new Set(Object.values(activeContributions))
	).sort((a, b) => a - b)

	if (levels.length <= 1) {
		const totalPot = Object.values(contributions).reduce((a, b) => a + b, 0)
		return createSimplePot(totalPot, activeSeats)
	}

	const pots: SidePot[] = []
	let previousLevel = 0
	let potId = 1

	for (const level of levels) {
		const increment = level - previousLevel
		const eligibleSeats = findEligibleSeatsForLevel(level, activeContributions)

		if (eligibleSeats.length > 0 && increment > 0) {
			const potAmount = calculatePotAmountForLevel(
				level,
				previousLevel,
				contributions
			)
			pots.push(createPot(potId, potAmount, eligibleSeats, level))
			potId++
		}

		previousLevel = level
	}

	return pots
}

