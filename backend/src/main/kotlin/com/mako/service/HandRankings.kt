package com.mako.service

/**
 * Hand type categories with their absolute rank ranges.
 *
 * Based on the 7,462 unique 5-card poker hands:
 * - Rank 1 = Weakest (7-5-4-3-2 unsuited)
 * - Rank 7462 = Strongest (Royal Flush)
 *
 * These ranges are derived from the mathematical enumeration of all
 * distinguishable 5-card poker hands from a standard 52-card deck.
 */
enum class HandType(
    val minRank: Int,
    val maxRank: Int,
    val displayName: String
) {
    HIGH_CARD(1, 1277, "High Card"),
    ONE_PAIR(1278, 4137, "Pair"),
    TWO_PAIR(4138, 4995, "Two Pair"),
    THREE_OF_A_KIND(4996, 5853, "Three of a Kind"),
    STRAIGHT(5854, 5863, "Straight"),
    FLUSH(5864, 7140, "Flush"),
    FULL_HOUSE(7141, 7296, "Full House"),
    FOUR_OF_A_KIND(7297, 7452, "Four of a Kind"),
    STRAIGHT_FLUSH(7453, 7462, "Straight Flush");

    companion object {
        /**
         * Determines hand type from an absolute rank value.
         *
         * @param rank The absolute rank (1-7462)
         * @return The corresponding HandType
         * @throws IllegalArgumentException if rank is out of range
         */
        fun fromRank(rank: Int): HandType {
            require(rank in 1..7462) {
                "Invalid hand rank: $rank (must be 1-7462)"
            }
            return entries.first { rank in it.minRank..it.maxRank }
        }
    }
}

/**
 * Constants for hand ranking calculations.
 */
object HandRankingConstants {

    /** Minimum possible hand rank (7-high) */
    const val MIN_HAND_RANK = 1

    /** Maximum possible hand rank (Royal Flush) */
    const val MAX_HAND_RANK = 7462

    /** Total number of unique 5-card hand rankings */
    const val TOTAL_DISTINCT_HANDS = 7462

    /**
     * Base rank values for calculating absolute hand ranking.
     * Each hand type starts after the previous type's range ends.
     */
    val HAND_TYPE_BASE_RANKS = mapOf(
        HandType.HIGH_CARD to 0,
        HandType.ONE_PAIR to 1277,
        HandType.TWO_PAIR to 4137,
        HandType.THREE_OF_A_KIND to 4995,
        HandType.STRAIGHT to 5853,
        HandType.FLUSH to 5863,
        HandType.FULL_HOUSE to 7140,
        HandType.FOUR_OF_A_KIND to 7296,
        HandType.STRAIGHT_FLUSH to 7452
    )

    /**
     * Number of distinct hands within each category.
     */
    val HAND_TYPE_COUNTS = mapOf(
        HandType.HIGH_CARD to 1277,
        HandType.ONE_PAIR to 2860,
        HandType.TWO_PAIR to 858,
        HandType.THREE_OF_A_KIND to 858,
        HandType.STRAIGHT to 10,
        HandType.FLUSH to 1277,
        HandType.FULL_HOUSE to 156,
        HandType.FOUR_OF_A_KIND to 156,
        HandType.STRAIGHT_FLUSH to 10
    )
}

