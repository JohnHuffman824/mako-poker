import type { Card } from './card'

/**
 * Hand types in order from lowest to highest.
 */
export enum HandType {
	HIGH_CARD = 1,
	ONE_PAIR = 2,
	TWO_PAIR = 3,
	THREE_OF_A_KIND = 4,
	STRAIGHT = 5,
	FLUSH = 6,
	FULL_HOUSE = 7,
	FOUR_OF_A_KIND = 8,
	STRAIGHT_FLUSH = 9,
	ROYAL_FLUSH = 10
}

/**
 * Hand type display names.
 */
export const HAND_TYPE_NAMES: Record<HandType, string> = {
	[HandType.HIGH_CARD]: 'High Card',
	[HandType.ONE_PAIR]: 'One Pair',
	[HandType.TWO_PAIR]: 'Two Pair',
	[HandType.THREE_OF_A_KIND]: 'Three of a Kind',
	[HandType.STRAIGHT]: 'Straight',
	[HandType.FLUSH]: 'Flush',
	[HandType.FULL_HOUSE]: 'Full House',
	[HandType.FOUR_OF_A_KIND]: 'Four of a Kind',
	[HandType.STRAIGHT_FLUSH]: 'Straight Flush',
	[HandType.ROYAL_FLUSH]: 'Royal Flush'
}

/**
 * Absolute rank ranges for each hand type (1-7462 scale, higher = better).
 */
export const HAND_TYPE_RANK_RANGES: Record<HandType, [number, number]> = {
	[HandType.HIGH_CARD]: [1, 1277],
	[HandType.ONE_PAIR]: [1278, 4137],
	[HandType.TWO_PAIR]: [4138, 4995],
	[HandType.THREE_OF_A_KIND]: [4996, 5853],
	[HandType.STRAIGHT]: [5854, 5863],
	[HandType.FLUSH]: [5864, 7140],
	[HandType.FULL_HOUSE]: [7141, 7296],
	[HandType.FOUR_OF_A_KIND]: [7297, 7452],
	[HandType.STRAIGHT_FLUSH]: [7453, 7461],
	[HandType.ROYAL_FLUSH]: [7462, 7462]
}

/**
 * Result of hand evaluation.
 */
export interface HandResult {
	absoluteRank: number
	handType: HandType
	cards: Card[]
	description: string
}

/**
 * Gets hand type from absolute rank.
 */
export function getHandTypeFromRank(absoluteRank: number): HandType {
	for (const [handType, [min, max]] of Object.entries(HAND_TYPE_RANK_RANGES)) {
		if (absoluteRank >= min && absoluteRank <= max) {
			return Number(handType) as HandType
		}
	}
	return HandType.HIGH_CARD
}

