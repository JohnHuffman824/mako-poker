import { HandType } from '@mako/shared'

/**
 * Base rank values for calculating absolute hand ranking.
 * Each hand type starts after the previous type's range ends.
 */
export const HAND_TYPE_BASE_RANKS: Record<HandType, number> = {
	[HandType.HIGH_CARD]: 0,
	[HandType.ONE_PAIR]: 1277,
	[HandType.TWO_PAIR]: 4137,
	[HandType.THREE_OF_A_KIND]: 4995,
	[HandType.STRAIGHT]: 5853,
	[HandType.FLUSH]: 5863,
	[HandType.FULL_HOUSE]: 7140,
	[HandType.FOUR_OF_A_KIND]: 7296,
	[HandType.STRAIGHT_FLUSH]: 7452,
	[HandType.ROYAL_FLUSH]: 7461
}

/**
 * Number of distinct hands within each category.
 */
export const HAND_TYPE_COUNTS: Record<HandType, number> = {
	[HandType.HIGH_CARD]: 1277,
	[HandType.ONE_PAIR]: 2860,
	[HandType.TWO_PAIR]: 858,
	[HandType.THREE_OF_A_KIND]: 858,
	[HandType.STRAIGHT]: 10,
	[HandType.FLUSH]: 1277,
	[HandType.FULL_HOUSE]: 156,
	[HandType.FOUR_OF_A_KIND]: 156,
	[HandType.STRAIGHT_FLUSH]: 9,
	[HandType.ROYAL_FLUSH]: 1
}

/** Minimum possible hand rank (7-high) */
export const MIN_HAND_RANK = 1

/** Maximum possible hand rank (Royal Flush) */
export const MAX_HAND_RANK = 7462

/**
 * Determines hand type from an absolute rank value.
 */
export function getHandTypeFromAbsoluteRank(rank: number): HandType {
	if (rank < 1 || rank > 7462) {
		throw new Error(`Invalid hand rank: ${rank} (must be 1-7462)`)
	}

	if (rank <= 1277) return HandType.HIGH_CARD
	if (rank <= 4137) return HandType.ONE_PAIR
	if (rank <= 4995) return HandType.TWO_PAIR
	if (rank <= 5853) return HandType.THREE_OF_A_KIND
	if (rank <= 5863) return HandType.STRAIGHT
	if (rank <= 7140) return HandType.FLUSH
	if (rank <= 7296) return HandType.FULL_HOUSE
	if (rank <= 7452) return HandType.FOUR_OF_A_KIND
	if (rank <= 7461) return HandType.STRAIGHT_FLUSH
	return HandType.ROYAL_FLUSH
}

