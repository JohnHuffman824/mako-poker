/**
 * Constants for hand evaluation rank calculations.
 * Used to compute absolute hand rankings within each hand type.
 */
export const HAND_EVAL = {
	/**
	 * Rank ranges for each hand type - must match HAND_TYPE_BASE_RANKS spacing.
	 */
	RANGE: {
		HIGH_CARD: 1277,
		FLUSH: 1277,
		TWO_PAIR: 858,
		THREE_OF_KIND: 858,
		FULL_HOUSE: 156,
		FOUR_OF_KIND: 156
	},

	/**
	 * One pair rank calculation multipliers.
	 * Uses wider range to preserve third kicker distinction.
	 */
	ONE_PAIR: {
		PAIR_MULTIPLIER: 1690,
		FIRST_KICKER_MULTIPLIER: 130,
		SECOND_KICKER_MULTIPLIER: 10,
		THIRD_KICKER_MULTIPLIER: 1,
		MAX_ENCODED: 22092,
		TARGET_RANGE: 2859
	}
} as const

