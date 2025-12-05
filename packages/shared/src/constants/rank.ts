/**
 * Numeric values for card ranks (2-14).
 * Used in hand evaluation and comparison logic.
 */
export const Rank = {
	TWO: 2,
	THREE: 3,
	FOUR: 4,
	FIVE: 5,
	SIX: 6,
	SEVEN: 7,
	EIGHT: 8,
	NINE: 9,
	TEN: 10,
	JACK: 11,
	QUEEN: 12,
	KING: 13,
	ACE: 14
} as const

export type RankValue = typeof Rank[keyof typeof Rank]

