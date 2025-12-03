package com.mako.service

import com.mako.model.Card
import com.mako.enums.Rank

/**
 * Result of hand evaluation with standardized ranking.
 *
 * @property absoluteRank Ranking from 1-7462 (higher = better)
 * @property handType The category of hand (pair, flush, etc.)
 * @property description Human-readable description of the hand
 */
data class HandResult(
    val absoluteRank: Int,
    val handType: HandType,
    val description: String
) : Comparable<HandResult> {
    override fun compareTo(other: HandResult): Int =
        absoluteRank.compareTo(other.absoluteRank)

    /**
     * Display name for the hand type.
     */
    val handName: String get() = handType.displayName
}

/**
 * Evaluates poker hands using standard Texas Hold'em rules.
 *
 * Returns absolute rankings from 1-7462 where higher is better.
 * This standardized ranking allows direct comparison between any two hands.
 */
object HandEvaluator {

    /**
     * Evaluates best 5-card hand from available cards.
     * Supports 5, 6, or 7 card inputs.
     *
     * @param holeCards Player's hole cards (2 cards)
     * @param communityCards Community cards (3-5 cards)
     * @return HandResult with absolute ranking
     */
    fun evaluate(
        holeCards: List<Card>,
        communityCards: List<Card>
    ): HandResult {
        val allCards = holeCards + communityCards
        require(allCards.size in 5..7) {
            "Must have 5-7 cards, got ${allCards.size}"
        }

        // Generate all 5-card combinations and find best
        val combinations = generateCombinations(allCards, 5)
        return combinations.map { evaluateFiveCards(it) }.maxOrNull()
            ?: throw IllegalStateException("No valid hand found")
    }

    /**
     * Evaluates a specific 5-card hand.
     */
    private fun evaluateFiveCards(cards: List<Card>): HandResult {
        val values = cards.map { it.rank.value }.sorted()
        val suits = cards.map { it.suit }
        val valueCounts = values.groupingBy { it }.eachCount()

        val isFlush = suits.distinct().size == 1
        val isStraight = checkStraight(values)
        val isWheel = values == listOf(2, 3, 4, 5, 14) // A-2-3-4-5

        // Straight flush (includes royal flush)
        if (isFlush && isStraight) {
            val highCard = if (isWheel) 5 else values.last()
            val rankWithinType = calculateStraightFlushRank(highCard)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.STRAIGHT_FLUSH
                ]!! + rankWithinType,
                handType = HandType.STRAIGHT_FLUSH,
                description = if (highCard == 14) "Royal Flush" else 
                    "Straight Flush, ${rankToName(highCard)} high"
            )
        }

        // Four of a kind
        val fourOfKind = valueCounts.entries.find { it.value == 4 }?.key
        if (fourOfKind != null) {
            val kicker = values.first { it != fourOfKind }
            val rankWithinType = calculateFourOfKindRank(fourOfKind, kicker)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.FOUR_OF_A_KIND
                ]!! + rankWithinType,
                handType = HandType.FOUR_OF_A_KIND,
                description = "Four of a Kind, ${rankToName(fourOfKind)}s"
            )
        }

        // Full house
        val threeOfKind = valueCounts.entries.find { it.value == 3 }?.key
        val pair = valueCounts.entries.find { it.value == 2 }?.key
        if (threeOfKind != null && pair != null) {
            val rankWithinType = calculateFullHouseRank(threeOfKind, pair)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.FULL_HOUSE
                ]!! + rankWithinType,
                handType = HandType.FULL_HOUSE,
                description = "Full House, ${rankToName(threeOfKind)}s " +
                    "full of ${rankToName(pair)}s"
            )
        }

        // Flush
        if (isFlush) {
            val rankWithinType = calculateFlushRank(values)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.FLUSH
                ]!! + rankWithinType,
                handType = HandType.FLUSH,
                description = "Flush, ${rankToName(values.last())} high"
            )
        }

        // Straight
        if (isStraight) {
            val highCard = if (isWheel) 5 else values.last()
            val rankWithinType = calculateStraightRank(highCard)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.STRAIGHT
                ]!! + rankWithinType,
                handType = HandType.STRAIGHT,
                description = "Straight, ${rankToName(highCard)} high"
            )
        }

        // Three of a kind
        if (threeOfKind != null) {
            val kickers = values.filter { it != threeOfKind }.sortedDescending()
            val rankWithinType = calculateThreeOfKindRank(threeOfKind, kickers)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.THREE_OF_A_KIND
                ]!! + rankWithinType,
                handType = HandType.THREE_OF_A_KIND,
                description = "Three of a Kind, ${rankToName(threeOfKind)}s"
            )
        }

        // Two pair
        val pairs = valueCounts.entries
            .filter { it.value == 2 }
            .map { it.key }
            .sortedDescending()
        if (pairs.size == 2) {
            val kicker = values.first { it !in pairs }
            val rankWithinType = calculateTwoPairRank(
                pairs[0],
                pairs[1],
                kicker
            )
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.TWO_PAIR
                ]!! + rankWithinType,
                handType = HandType.TWO_PAIR,
                description = "Two Pair, ${rankToName(pairs[0])}s and " +
                    "${rankToName(pairs[1])}s"
            )
        }

        // One pair
        if (pairs.size == 1) {
            val kickers = values.filter { it != pairs[0] }.sortedDescending()
            val rankWithinType = calculateOnePairRank(pairs[0], kickers)
            return HandResult(
                absoluteRank = HandRankingConstants.HAND_TYPE_BASE_RANKS[
                    HandType.ONE_PAIR
                ]!! + rankWithinType,
                handType = HandType.ONE_PAIR,
                description = "Pair of ${rankToName(pairs[0])}s"
            )
        }

        // High card
        val rankWithinType = calculateHighCardRank(values)
        return HandResult(
            absoluteRank = rankWithinType,
            handType = HandType.HIGH_CARD,
            description = "High Card, ${rankToName(values.last())}"
        )
    }

    /**
     * Checks if 5 cards form a straight.
     * Handles special case of A-2-3-4-5 (wheel).
     */
    private fun checkStraight(values: List<Int>): Boolean {
        val sorted = values.sorted()

        // Normal straight: consecutive values
        if (sorted.last() - sorted.first() == 4 &&
            sorted.distinct().size == 5
        ) {
            return true
        }

        // Wheel (A-2-3-4-5): Ace acts as 1
        if (sorted == listOf(2, 3, 4, 5, 14)) {
            return true
        }

        return false
    }

    // =========================================================================
    // Rank calculation helpers
    // Modern positional encoding for precise hand comparison
    // =========================================================================

    /**
     * Encodes a list of card values into a single comparable number.
     * Uses base-15 encoding to ensure each position is distinct.
     *
     * Example: [14, 13, 12, 11, 9] -> 14*15^4 + 13*15^3 + 12*15^2 + 11*15 + 9
     */
    private fun encodeCardValues(values: List<Int>): Long {
        var encoded = 0L
        for (i in values.indices) {
            val power = values.size - 1 - i
            encoded += values[i] * Math.pow(15.0, power.toDouble()).toLong()
        }
        return encoded
    }

    /**
     * Normalizes an encoded value to fit within a rank range.
     * Maps the full encoded space proportionally to the target range.
     */
    private fun normalizeToRange(
        encoded: Long,
        minPossible: Long,
        maxPossible: Long,
        targetMin: Int,
        targetMax: Int
    ): Int {
        require(maxPossible >= minPossible) {
            "Invalid range: max ($maxPossible) < min ($minPossible)"
        }
        
        if (maxPossible == minPossible) return targetMin
        
        val proportion = (encoded - minPossible).toDouble() / 
            (maxPossible - minPossible).toDouble()
        val rangeSize = targetMax - targetMin
        
        return targetMin + (proportion * rangeSize).toInt()
    }

    private fun calculateHighCardRank(values: List<Int>): Int {
        val sorted = values.sortedDescending()
        val encoded = encodeCardValues(sorted)
        
        // Min: [7,5,4,3,2] = lowest high card
        // Max: [14,13,12,11,9] = highest high card (no straight)
        val minEncoded = encodeCardValues(listOf(7, 5, 4, 3, 2))
        val maxEncoded = encodeCardValues(listOf(14, 13, 12, 11, 9))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 1277)
    }

    private fun calculateOnePairRank(pairValue: Int, kickers: List<Int>): Int {
        // Encode: pair value + 3 kickers
        val values = listOf(pairValue) + kickers.take(3).sortedDescending()
        val encoded = encodeCardValues(values)
        
        // Min: Pair of 2s with 5-4-3 kickers
        // Max: Pair of Aces with K-Q-J kickers
        val minEncoded = encodeCardValues(listOf(2, 5, 4, 3))
        val maxEncoded = encodeCardValues(listOf(14, 13, 12, 11))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 2860)
    }

    private fun calculateTwoPairRank(
        highPair: Int,
        lowPair: Int,
        kicker: Int
    ): Int {
        val values = listOf(highPair, lowPair, kicker)
        val encoded = encodeCardValues(values)
        
        // Min: 3-2 with 4 kicker
        // Max: A-K with Q kicker
        val minEncoded = encodeCardValues(listOf(3, 2, 4))
        val maxEncoded = encodeCardValues(listOf(14, 13, 12))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 858)
    }

    private fun calculateThreeOfKindRank(
        tripsValue: Int,
        kickers: List<Int>
    ): Int {
        val values = listOf(tripsValue) + kickers.take(2).sortedDescending()
        val encoded = encodeCardValues(values)
        
        // Min: Trip 2s with 5-4 kickers
        // Max: Trip Aces with K-Q kickers
        val minEncoded = encodeCardValues(listOf(2, 5, 4))
        val maxEncoded = encodeCardValues(listOf(14, 13, 12))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 858)
    }

    private fun calculateStraightRank(highCard: Int): Int {
        // 10 possible straights (5-high through A-high)
        require(highCard in 5..14) {
            "Invalid straight high card: $highCard"
        }
        return if (highCard == 5) 1 else (highCard - 4)
    }

    private fun calculateFlushRank(values: List<Int>): Int {
        val sorted = values.sortedDescending()
        val encoded = encodeCardValues(sorted)
        
        // Same as high card
        val minEncoded = encodeCardValues(listOf(7, 5, 4, 3, 2))
        val maxEncoded = encodeCardValues(listOf(14, 13, 12, 11, 9))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 1277)
    }

    private fun calculateFullHouseRank(trips: Int, pair: Int): Int {
        val values = listOf(trips, pair)
        val encoded = encodeCardValues(values)
        
        // Min: 2-2-2-3-3 (trip 2s over 3s)
        // Max: A-A-A-K-K (trip Aces over Kings)
        val minEncoded = encodeCardValues(listOf(2, 3))
        val maxEncoded = encodeCardValues(listOf(14, 13))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 156)
    }

    private fun calculateFourOfKindRank(quads: Int, kicker: Int): Int {
        val values = listOf(quads, kicker)
        val encoded = encodeCardValues(values)
        
        // Min: 2-2-2-2-3 (quad 2s with 3 kicker)
        // Max: A-A-A-A-K (quad Aces with K kicker)
        val minEncoded = encodeCardValues(listOf(2, 3))
        val maxEncoded = encodeCardValues(listOf(14, 13))
        
        return normalizeToRange(encoded, minEncoded, maxEncoded, 1, 156)
    }

    private fun calculateStraightFlushRank(highCard: Int): Int {
        // 10 possible (5-high through A-high)
        require(highCard in 5..14) {
            "Invalid straight flush high card: $highCard"
        }
        return if (highCard == 5) 1 else (highCard - 4)
    }

    /**
     * Converts numeric rank value to display name.
     */
    private fun rankToName(value: Int): String = when (value) {
        14 -> "Ace"
        13 -> "King"
        12 -> "Queen"
        11 -> "Jack"
        10 -> "Ten"
        else -> value.toString()
    }

    /**
     * Generates all k-combinations from list.
     */
    private fun <T> generateCombinations(
        list: List<T>,
        k: Int
    ): List<List<T>> {
        if (k == 0) return listOf(emptyList())
        if (list.isEmpty()) return emptyList()

        val head = list.first()
        val tail = list.drop(1)

        val withHead = generateCombinations(tail, k - 1)
            .map { listOf(head) + it }
        val withoutHead = generateCombinations(tail, k)

        return withHead + withoutHead
    }
}
