package com.mako.service

import com.mako.TestHelpers.cards
import com.mako.TestHelpers.sevenCards
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName

/**
 * Comprehensive tests for HandEvaluator.
 *
 * Tests all hand types, kicker comparisons, and edge cases.
 * Uses the new absoluteRank (1-7462) system where higher = better.
 */
@DisplayName("HandEvaluator Tests")
class HandEvaluatorTest {

    // =========================================================================
    // 2.1 Hand Type Recognition (9 tests)
    // =========================================================================

    @Test
    @DisplayName("Recognizes High Card")
    fun testHighCard() {
        val hand = sevenCards("AH KD", "QC JS 9H 8D 7C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.HIGH_CARD, result.handType)
        assertTrue(result.absoluteRank in HandType.HIGH_CARD.minRank..HandType.HIGH_CARD.maxRank)
        assertEquals("High Card", result.handType.displayName)
    }

    @Test
    @DisplayName("Recognizes One Pair")
    fun testOnePair() {
        val hand = sevenCards("AH AD", "KC QS JH 9D 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.ONE_PAIR, result.handType)
        assertTrue(result.absoluteRank in HandType.ONE_PAIR.minRank..HandType.ONE_PAIR.maxRank)
    }

    @Test
    @DisplayName("Recognizes Two Pair")
    fun testTwoPair() {
        val hand = sevenCards("AH AD", "KC KS QH 9D 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.TWO_PAIR, result.handType)
        assertTrue(result.absoluteRank in HandType.TWO_PAIR.minRank..HandType.TWO_PAIR.maxRank)
    }

    @Test
    @DisplayName("Recognizes Three of a Kind")
    fun testThreeOfKind() {
        val hand = sevenCards("AH AD", "AC KS QH 9D 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.THREE_OF_A_KIND, result.handType)
        assertTrue(result.absoluteRank in HandType.THREE_OF_A_KIND.minRank..HandType.THREE_OF_A_KIND.maxRank)
    }

    @Test
    @DisplayName("Recognizes Straight")
    fun testStraight() {
        val hand = sevenCards("9H 8D", "7C 6S 5H KD 2C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.STRAIGHT, result.handType)
        assertTrue(result.absoluteRank in HandType.STRAIGHT.minRank..HandType.STRAIGHT.maxRank)
    }

    @Test
    @DisplayName("Recognizes Flush")
    fun testFlush() {
        val hand = sevenCards("AH KH", "QH JH 9H 8D 2C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.FLUSH, result.handType)
        assertTrue(result.absoluteRank in HandType.FLUSH.minRank..HandType.FLUSH.maxRank)
    }

    @Test
    @DisplayName("Recognizes Full House")
    fun testFullHouse() {
        val hand = sevenCards("AH AD", "AC KS KH 9D 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.FULL_HOUSE, result.handType)
        assertTrue(result.absoluteRank in HandType.FULL_HOUSE.minRank..HandType.FULL_HOUSE.maxRank)
    }

    @Test
    @DisplayName("Recognizes Four of a Kind")
    fun testFourOfKind() {
        val hand = sevenCards("AH AD", "AC AS KH 9D 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.FOUR_OF_A_KIND, result.handType)
        assertTrue(result.absoluteRank in HandType.FOUR_OF_A_KIND.minRank..HandType.FOUR_OF_A_KIND.maxRank)
    }

    @Test
    @DisplayName("Recognizes Straight Flush")
    fun testStraightFlush() {
        val hand = sevenCards("9H 8H", "7H 6H 5H KD 2C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.STRAIGHT_FLUSH, result.handType)
        assertTrue(result.absoluteRank in HandType.STRAIGHT_FLUSH.minRank..HandType.STRAIGHT_FLUSH.maxRank)
    }

    // =========================================================================
    // 2.2 Edge Cases for Straights (4 tests)
    // =========================================================================

    @Test
    @DisplayName("Recognizes Wheel (A-2-3-4-5)")
    fun testWheel() {
        val hand = sevenCards("AH 2D", "3C 4S 5H KD 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.STRAIGHT, result.handType)
        assertTrue(result.description.contains("Straight"))
    }

    @Test
    @DisplayName("Recognizes Broadway (T-J-Q-K-A)")
    fun testBroadway() {
        val hand = sevenCards("AH KD", "QC JS TH 8D 2C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.STRAIGHT, result.handType)
        assertTrue(result.description.contains("Ace"))
    }

    @Test
    @DisplayName("Rejects Near-Straight (A-2-3-4-6)")
    fun testNearStraightRejected() {
        val hand = sevenCards("AH 2D", "3C 4S 6H KD 8C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertNotEquals(HandType.STRAIGHT, result.handType)
    }

    @Test
    @DisplayName("Rejects Wrap-Around (Q-K-A-2-3)")
    fun testWrapAroundRejected() {
        val hand = sevenCards("QH KD", "AC 2S 3H 8D 7C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertNotEquals(HandType.STRAIGHT, result.handType)
    }

    // =========================================================================
    // 2.3 Kicker Comparisons using absoluteRank
    // =========================================================================

    @Test
    @DisplayName("Same pair, different kickers: AA-K-Q-J beats AA-K-Q-T")
    fun testPairKickerComparison() {
        val hand1 = sevenCards("AH AD", "KC QS JH 9D 8C")
        val hand2 = sevenCards("AS AC", "KD QH TH 9S 8D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "AA-K-Q-J should beat AA-K-Q-T")
    }

    @Test
    @DisplayName("Same two pair, kicker decides: AA-KK-Q beats AA-KK-J")
    fun testTwoPairKickerComparison() {
        val hand1 = sevenCards("AH AD", "KC KS QH 9D 8C")
        val hand2 = sevenCards("AS AC", "KD KH JH 9S 8D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "AA-KK-Q should beat AA-KK-J")
    }

    @Test
    @DisplayName("Same trips, kicker decides: AAA-K-Q beats AAA-K-J")
    fun testTripsKickerComparison() {
        val hand1 = sevenCards("AH AD", "AC KS QH 9D 8C")
        val hand2 = sevenCards("AS AC", "AH KD JH 9S 8D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "AAA-K-Q should beat AAA-K-J")
    }

    @Test
    @DisplayName("High card kicker cascade: A-K-Q-J-9 beats A-K-Q-J-8")
    fun testHighCardKickerCascade() {
        val hand1 = sevenCards("AH KD", "QC JS 9H 8D 2C")
        val hand2 = sevenCards("AS KC", "QD JH 8H 7D 2S")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "A-K-Q-J-9 should beat A-K-Q-J-8")
    }

    @Test
    @DisplayName("Tied hands with identical kickers")
    fun testTiedHands() {
        val hand1 = sevenCards("AH KD", "QC JS 9H 8D 2C")
        val hand2 = sevenCards("AS KC", "QD JH 9S 8C 2D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertEquals(result1.absoluteRank, result2.absoluteRank,
            "Hands should be tied with same absolute rank")
    }

    @Test
    @DisplayName("Higher pair beats lower pair: AA beats KK")
    fun testHigherPairWins() {
        val hand1 = sevenCards("AH AD", "QC JS 9H 8D 7C")
        val hand2 = sevenCards("KS KC", "QD JH 9S 8C 7D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "AA should beat KK")
    }

    @Test
    @DisplayName("Higher two-pair beats lower: AA-KK beats KK-QQ")
    fun testHigherTwoPairWins() {
        val hand1 = sevenCards("AH AD", "KC KS QH 9D 8C")
        val hand2 = sevenCards("KD KH", "QC QS JH 9S 8D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "AA-KK should beat KK-QQ")
    }

    @Test
    @DisplayName("Same full house, trips matter: AAA-KK beats QQQ-AA")
    fun testFullHouseTripsComparison() {
        val hand1 = sevenCards("AH AD", "AC KS KH 9D 8C")
        val hand2 = sevenCards("QS QC", "QD AH AS 9H 8D")

        val result1 = HandEvaluator.evaluate(hand1.take(2), hand1.drop(2))
        val result2 = HandEvaluator.evaluate(hand2.take(2), hand2.drop(2))

        assertTrue(result1.absoluteRank > result2.absoluteRank,
            "AAA-KK should beat QQQ-AA")
    }

    // =========================================================================
    // 2.4 Best 5-Card Selection from 7 Cards
    // =========================================================================

    @Test
    @DisplayName("7 cards with hidden flush (5 cards make flush, 2 don't)")
    fun testHiddenFlush() {
        val hand = sevenCards("AH KH", "QH JH 9H 8D 2C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.FLUSH, result.handType, "Should find flush")
    }

    @Test
    @DisplayName("7 cards with full house vs flush (full house wins)")
    fun testFullHouseBeatsFlush() {
        // 7 cards: AA-A-KK-KH (full house + possible flush)
        val hand = sevenCards("AH AD", "AC KH KS 9H 2H")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.FULL_HOUSE, result.handType,
            "Should prefer full house over flush")
    }

    @Test
    @DisplayName("7 cards where best hand uses 1 hole + 4 board")
    fun testOneHoleCardUsed() {
        // Hole: AH, 2D; Board: KC KS KH QD QC
        // Best hand: KKK-QQ (only uses one hole card or none)
        val hand = sevenCards("AH 2D", "KC KS KH QD QC")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.FULL_HOUSE, result.handType, "Should make full house")
    }

    @Test
    @DisplayName("7 cards where best hand uses 0 hole cards (play the board)")
    fun testPlayTheBoard() {
        // Hole: 2H 3D; Board: AC KC QS JS TH
        // Best hand is the straight on board
        val hand = sevenCards("2H 3D", "AC KC QS JS TH")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.STRAIGHT, result.handType, "Should make straight")
        assertTrue(result.description.contains("Ace"), "Should be Ace-high straight")
    }

    @Test
    @DisplayName("7 cards with multiple possible straights")
    fun testMultipleStraightOptions() {
        // Can make 9-high or 8-high straight
        val hand = sevenCards("9H 8D", "7C 6S 5H 4D 2C")
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertEquals(HandType.STRAIGHT, result.handType, "Should make straight")
    }

    // =========================================================================
    // 2.5 Card Count Scenarios
    // =========================================================================

    @Test
    @DisplayName("Handles 7 cards (2 hole + 5 community)")
    fun testSevenCards() {
        val holeCards = cards("AH KD")
        val community = cards("QC JS 9H 8D 2C")

        val result = HandEvaluator.evaluate(holeCards, community)

        assertEquals(HandType.HIGH_CARD, result.handType)
    }

    @Test
    @DisplayName("Handles 6 cards (2 hole + 4 community - turn)")
    fun testSixCards() {
        val holeCards = cards("AH AD")
        val community = cards("KC QS JH 9D")

        val result = HandEvaluator.evaluate(holeCards, community)

        assertEquals(HandType.ONE_PAIR, result.handType)
    }

    @Test
    @DisplayName("Handles 5 cards (2 hole + 3 community - flop)")
    fun testFiveCards() {
        val holeCards = cards("AH AD")
        val community = cards("KC QS JH")

        val result = HandEvaluator.evaluate(holeCards, community)

        assertEquals(HandType.ONE_PAIR, result.handType)
    }

    // =========================================================================
    // Hand Type Ordering
    // =========================================================================

    @Test
    @DisplayName("Hand types are ordered correctly - higher ranks beat lower")
    fun testHandTypeOrdering() {
        val highCard = sevenCards("AH KD", "QC JS 9H 8D 2C")
        val pair = sevenCards("AH AD", "KC QS JH 9D 8C")
        val twoPair = sevenCards("AH AD", "KC KS QH 9D 8C")
        val trips = sevenCards("AH AD", "AC KS QH 9D 8C")
        val straight = sevenCards("9H 8D", "7C 6S 5H KD 2C")
        val flush = sevenCards("AH KH", "QH JH 9H 8D 2C")
        val fullHouse = sevenCards("AH AD", "AC KS KH 9D 8C")
        val quads = sevenCards("AH AD", "AC AS KH 9D 8C")
        val straightFlush = sevenCards("9H 8H", "7H 6H 5H KD 2C")

        val results = listOf(
            HandEvaluator.evaluate(highCard.take(2), highCard.drop(2)),
            HandEvaluator.evaluate(pair.take(2), pair.drop(2)),
            HandEvaluator.evaluate(twoPair.take(2), twoPair.drop(2)),
            HandEvaluator.evaluate(trips.take(2), trips.drop(2)),
            HandEvaluator.evaluate(straight.take(2), straight.drop(2)),
            HandEvaluator.evaluate(flush.take(2), flush.drop(2)),
            HandEvaluator.evaluate(fullHouse.take(2), fullHouse.drop(2)),
            HandEvaluator.evaluate(quads.take(2), quads.drop(2)),
            HandEvaluator.evaluate(straightFlush.take(2), straightFlush.drop(2))
        )

        // Each hand should have a higher absolute rank than the previous
        for (i in 0 until results.size - 1) {
            assertTrue(results[i].absoluteRank < results[i + 1].absoluteRank,
                "${results[i].handType} should rank lower than ${results[i + 1].handType}")
        }
    }

    // =========================================================================
    // Absolute Rank Range Verification
    // =========================================================================

    @Test
    @DisplayName("Absolute rank is within valid range (1-7462)")
    fun testAbsoluteRankRange() {
        val hand = sevenCards("AH KH", "QH JH TH KD 2C") // Royal flush
        val result = HandEvaluator.evaluate(hand.take(2), hand.drop(2))

        assertTrue(result.absoluteRank >= 1)
        assertTrue(result.absoluteRank <= 7462)
    }
}
