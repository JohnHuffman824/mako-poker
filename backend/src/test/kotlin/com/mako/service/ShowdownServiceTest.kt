package com.mako.service

import com.mako.model.Card
import com.mako.model.Rank
import com.mako.model.SidePot
import com.mako.model.Suit
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Tests for ShowdownService.
 *
 * Tests cover:
 * - Single winner scenarios
 * - Split pot (tie) scenarios
 * - Side pot winner different from main pot winner
 * - Winner by fold
 * - Edge cases
 */
class ShowdownServiceTest {

    private lateinit var showdownService: ShowdownService

    @BeforeEach
    fun setup() {
        showdownService = ShowdownService()
    }

    // Helper to create cards easily
    private fun card(rank: Rank, suit: Suit) = Card(rank, suit)

    // =========================================================================
    // Single winner tests
    // =========================================================================

    @Test
    fun `single winner gets entire pot`() {
        val players = listOf(
            ShowdownPlayer(
                seatIndex = 0,
                holeCards = listOf(
                    card(Rank.ACE, Suit.SPADES),
                    card(Rank.KING, Suit.SPADES)
                ),
                isFolded = false
            ),
            ShowdownPlayer(
                seatIndex = 1,
                holeCards = listOf(
                    card(Rank.TWO, Suit.HEARTS),
                    card(Rank.THREE, Suit.HEARTS)
                ),
                isFolded = false
            )
        )

        val community = listOf(
            card(Rank.QUEEN, Suit.DIAMONDS),
            card(Rank.JACK, Suit.CLUBS),
            card(Rank.TEN, Suit.HEARTS),
            card(Rank.FOUR, Suit.SPADES),
            card(Rank.FIVE, Suit.CLUBS)
        )

        val pots = listOf(
            SidePot(
                id = 0,
                amount = 100.0,
                eligiblePlayerSeats = mutableSetOf(0, 1),
                capPerPlayer = 50.0
            )
        )

        val result = showdownService.determineWinners(players, community, pots)

        assertEquals(1, result.potWinners.size)
        assertEquals(listOf(0), result.potWinners[0].winnerSeats)
        assertEquals(100.0, result.potWinners[0].amountPerWinner)
        assertTrue(result.potWinners[0].handDescription.contains("Straight"))
    }

    // =========================================================================
    // Split pot tests
    // =========================================================================

    @Test
    fun `tied hands split the pot equally`() {
        // Both players have same hand (play the board)
        val players = listOf(
            ShowdownPlayer(
                seatIndex = 0,
                holeCards = listOf(
                    card(Rank.TWO, Suit.SPADES),
                    card(Rank.THREE, Suit.SPADES)
                ),
                isFolded = false
            ),
            ShowdownPlayer(
                seatIndex = 1,
                holeCards = listOf(
                    card(Rank.TWO, Suit.HEARTS),
                    card(Rank.THREE, Suit.HEARTS)
                ),
                isFolded = false
            )
        )

        // Board has a straight that beats both hands
        val community = listOf(
            card(Rank.FIVE, Suit.DIAMONDS),
            card(Rank.SIX, Suit.CLUBS),
            card(Rank.SEVEN, Suit.HEARTS),
            card(Rank.EIGHT, Suit.SPADES),
            card(Rank.NINE, Suit.CLUBS)
        )

        val pots = listOf(
            SidePot(
                id = 0,
                amount = 100.0,
                eligiblePlayerSeats = mutableSetOf(0, 1),
                capPerPlayer = 50.0
            )
        )

        val result = showdownService.determineWinners(players, community, pots)

        assertEquals(1, result.potWinners.size)
        assertEquals(2, result.potWinners[0].winnerSeats.size)
        assertTrue(0 in result.potWinners[0].winnerSeats)
        assertTrue(1 in result.potWinners[0].winnerSeats)
        assertEquals(50.0, result.potWinners[0].amountPerWinner)
    }

    // =========================================================================
    // Side pot winner different from main pot
    // =========================================================================

    @Test
    fun `different winners for main and side pots`() {
        // Player 0: weak hand (eligible for both)
        // Player 1: best hand (eligible for main only - was all-in)
        // Player 2: medium hand (eligible for both)
        val players = listOf(
            ShowdownPlayer(
                seatIndex = 0,
                holeCards = listOf(
                    card(Rank.TWO, Suit.SPADES),
                    card(Rank.THREE, Suit.HEARTS) // Just high card
                ),
                isFolded = false
            ),
            ShowdownPlayer(
                seatIndex = 1,
                holeCards = listOf(
                    card(Rank.ACE, Suit.HEARTS), // Best hand - pair of aces
                    card(Rank.ACE, Suit.DIAMONDS)
                ),
                isFolded = false
            ),
            ShowdownPlayer(
                seatIndex = 2,
                holeCards = listOf(
                    card(Rank.KING, Suit.CLUBS), // Pair of kings
                    card(Rank.KING, Suit.SPADES)
                ),
                isFolded = false
            )
        )

        val community = listOf(
            card(Rank.SEVEN, Suit.DIAMONDS),
            card(Rank.EIGHT, Suit.CLUBS),
            card(Rank.NINE, Suit.HEARTS),
            card(Rank.JACK, Suit.SPADES),
            card(Rank.QUEEN, Suit.CLUBS)
        )

        // Main pot: all 3 eligible
        // Side pot: only 0 and 2 eligible (1 was all-in earlier)
        val pots = listOf(
            SidePot(
                id = 0,
                amount = 150.0,
                eligiblePlayerSeats = mutableSetOf(0, 1, 2),
                capPerPlayer = 50.0
            ),
            SidePot(
                id = 1,
                amount = 100.0,
                eligiblePlayerSeats = mutableSetOf(0, 2),
                capPerPlayer = 100.0
            )
        )

        val result = showdownService.determineWinners(players, community, pots)

        assertEquals(2, result.potWinners.size)

        // Main pot winner: Player 1 (pair of aces)
        assertEquals(listOf(1), result.potWinners[0].winnerSeats)
        assertEquals(150.0, result.potWinners[0].amountPerWinner)

        // Side pot winner: Player 2 (pair of kings - best among 0,2)
        assertEquals(listOf(2), result.potWinners[1].winnerSeats)
        assertEquals(100.0, result.potWinners[1].amountPerWinner)
    }

    // =========================================================================
    // Winner by fold tests
    // =========================================================================

    @Test
    fun `winner by fold gets all pots`() {
        val pots = listOf(
            SidePot(
                id = 0,
                amount = 100.0,
                eligiblePlayerSeats = mutableSetOf(0, 1, 2),
                capPerPlayer = 33.0
            ),
            SidePot(
                id = 1,
                amount = 50.0,
                eligiblePlayerSeats = mutableSetOf(0, 2),
                capPerPlayer = 50.0
            )
        )

        val result = showdownService.determineWinnerByFold(2, pots)

        assertEquals(2, result.potWinners.size)
        assertEquals(listOf(2), result.potWinners[0].winnerSeats)
        assertEquals(100.0, result.potWinners[0].amountPerWinner)
        assertEquals(listOf(2), result.potWinners[1].winnerSeats)
        assertEquals(50.0, result.potWinners[1].amountPerWinner)
        assertEquals(150.0, result.totalDistributed)
    }

    // =========================================================================
    // Edge cases
    // =========================================================================

    @Test
    fun `folded players are excluded from showdown`() {
        val players = listOf(
            ShowdownPlayer(
                seatIndex = 0,
                holeCards = listOf(
                    card(Rank.ACE, Suit.SPADES),
                    card(Rank.ACE, Suit.HEARTS)
                ),
                isFolded = true // Folded with best hand!
            ),
            ShowdownPlayer(
                seatIndex = 1,
                holeCards = listOf(
                    card(Rank.TWO, Suit.HEARTS),
                    card(Rank.THREE, Suit.HEARTS)
                ),
                isFolded = false
            )
        )

        val community = listOf(
            card(Rank.FOUR, Suit.DIAMONDS),
            card(Rank.FIVE, Suit.CLUBS),
            card(Rank.SIX, Suit.HEARTS),
            card(Rank.NINE, Suit.SPADES),
            card(Rank.TEN, Suit.CLUBS)
        )

        val pots = listOf(
            SidePot(
                id = 0,
                amount = 100.0,
                eligiblePlayerSeats = mutableSetOf(1), // Only non-folded
                capPerPlayer = 50.0
            )
        )

        val result = showdownService.determineWinners(players, community, pots)

        // Player 1 wins despite having worse cards because 0 folded
        assertEquals(listOf(1), result.potWinners[0].winnerSeats)
        assertEquals(100.0, result.potWinners[0].amountPerWinner)
    }

    @Test
    fun `empty pots list returns empty results`() {
        val players = listOf(
            ShowdownPlayer(
                seatIndex = 0,
                holeCards = listOf(
                    card(Rank.ACE, Suit.SPADES),
                    card(Rank.KING, Suit.SPADES)
                ),
                isFolded = false
            )
        )

        val community = listOf(
            card(Rank.QUEEN, Suit.DIAMONDS),
            card(Rank.JACK, Suit.CLUBS),
            card(Rank.TEN, Suit.HEARTS),
            card(Rank.FOUR, Suit.SPADES),
            card(Rank.FIVE, Suit.CLUBS)
        )

        val result = showdownService.determineWinners(players, community, emptyList())

        assertTrue(result.potWinners.isEmpty())
        assertEquals(0.0, result.totalDistributed)
    }

    @Test
    fun `all players folded returns empty results`() {
        val players = listOf(
            ShowdownPlayer(
                seatIndex = 0,
                holeCards = listOf(
                    card(Rank.ACE, Suit.SPADES),
                    card(Rank.KING, Suit.SPADES)
                ),
                isFolded = true
            ),
            ShowdownPlayer(
                seatIndex = 1,
                holeCards = listOf(
                    card(Rank.TWO, Suit.HEARTS),
                    card(Rank.THREE, Suit.HEARTS)
                ),
                isFolded = true
            )
        )

        val community = listOf(
            card(Rank.QUEEN, Suit.DIAMONDS),
            card(Rank.JACK, Suit.CLUBS),
            card(Rank.TEN, Suit.HEARTS),
            card(Rank.FOUR, Suit.SPADES),
            card(Rank.FIVE, Suit.CLUBS)
        )

        val pots = listOf(
            SidePot(
                id = 0,
                amount = 100.0,
                eligiblePlayerSeats = mutableSetOf(),
                capPerPlayer = 50.0
            )
        )

        val result = showdownService.determineWinners(players, community, pots)

        // When all players folded, no showdown occurs
        assertTrue(result.potWinners.isEmpty())
        assertEquals(0.0, result.totalDistributed)
    }

    // =========================================================================
    // Ranking helper tests
    // =========================================================================

    @Test
    fun `getRankedPlayers returns players sorted by hand strength`() {
        val playerHands = mapOf(
            0 to HandResult(100, HandType.HIGH_CARD, "High Card"),
            1 to HandResult(5000, HandType.THREE_OF_A_KIND, "Trips"),
            2 to HandResult(2000, HandType.ONE_PAIR, "Pair")
        )

        val ranked = showdownService.getRankedPlayers(playerHands)

        assertEquals(listOf(1, 2, 0), ranked)
    }
}

