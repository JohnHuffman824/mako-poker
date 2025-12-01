package com.mako.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

/**
 * Tests for Rank and Suit enums.
 */
class CardEnumsTest {

    // =========================================================================
    // Rank.fromSymbol tests
    // =========================================================================

    @Test
    fun `fromSymbol returns correct rank for all valid symbols`() {
        assertEquals(Rank.TWO, Rank.fromSymbol("2"))
        assertEquals(Rank.THREE, Rank.fromSymbol("3"))
        assertEquals(Rank.FOUR, Rank.fromSymbol("4"))
        assertEquals(Rank.FIVE, Rank.fromSymbol("5"))
        assertEquals(Rank.SIX, Rank.fromSymbol("6"))
        assertEquals(Rank.SEVEN, Rank.fromSymbol("7"))
        assertEquals(Rank.EIGHT, Rank.fromSymbol("8"))
        assertEquals(Rank.NINE, Rank.fromSymbol("9"))
        assertEquals(Rank.TEN, Rank.fromSymbol("T"))
        assertEquals(Rank.JACK, Rank.fromSymbol("J"))
        assertEquals(Rank.QUEEN, Rank.fromSymbol("Q"))
        assertEquals(Rank.KING, Rank.fromSymbol("K"))
        assertEquals(Rank.ACE, Rank.fromSymbol("A"))
    }

    @Test
    fun `fromSymbol is case insensitive`() {
        assertEquals(Rank.TEN, Rank.fromSymbol("t"))
        assertEquals(Rank.JACK, Rank.fromSymbol("j"))
        assertEquals(Rank.QUEEN, Rank.fromSymbol("q"))
        assertEquals(Rank.KING, Rank.fromSymbol("k"))
        assertEquals(Rank.ACE, Rank.fromSymbol("a"))
    }

    @Test
    fun `fromSymbol throws for invalid symbol`() {
        assertThrows<IllegalArgumentException> { Rank.fromSymbol("X") }
        assertThrows<IllegalArgumentException> { Rank.fromSymbol("1") }
        assertThrows<IllegalArgumentException> { Rank.fromSymbol("10") }
        assertThrows<IllegalArgumentException> { Rank.fromSymbol("") }
    }

    // =========================================================================
    // Rank.fromValue tests
    // =========================================================================

    @Test
    fun `fromValue returns correct rank for all valid values`() {
        assertEquals(Rank.TWO, Rank.fromValue(2))
        assertEquals(Rank.THREE, Rank.fromValue(3))
        assertEquals(Rank.FOUR, Rank.fromValue(4))
        assertEquals(Rank.FIVE, Rank.fromValue(5))
        assertEquals(Rank.SIX, Rank.fromValue(6))
        assertEquals(Rank.SEVEN, Rank.fromValue(7))
        assertEquals(Rank.EIGHT, Rank.fromValue(8))
        assertEquals(Rank.NINE, Rank.fromValue(9))
        assertEquals(Rank.TEN, Rank.fromValue(10))
        assertEquals(Rank.JACK, Rank.fromValue(11))
        assertEquals(Rank.QUEEN, Rank.fromValue(12))
        assertEquals(Rank.KING, Rank.fromValue(13))
        assertEquals(Rank.ACE, Rank.fromValue(14))
    }

    @Test
    fun `fromValue throws for invalid value`() {
        assertThrows<IllegalArgumentException> { Rank.fromValue(0) }
        assertThrows<IllegalArgumentException> { Rank.fromValue(1) }
        assertThrows<IllegalArgumentException> { Rank.fromValue(15) }
        assertThrows<IllegalArgumentException> { Rank.fromValue(-1) }
    }

    // =========================================================================
    // Rank value ordering tests
    // =========================================================================

    @Test
    fun `rank values are ordered correctly`() {
        val ranksInOrder = listOf(
            Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
            Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
            Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
        )

        for (i in 0 until ranksInOrder.size - 1) {
            val lower = ranksInOrder[i]
            val higher = ranksInOrder[i + 1]
            assert(lower.value < higher.value) {
                "${lower.name} should have lower value than ${higher.name}"
            }
        }
    }

    // =========================================================================
    // Suit.fromSymbol tests - Single character only
    // =========================================================================

    @Test
    fun `fromSymbol returns correct suit for single character`() {
        assertEquals(Suit.SPADES, Suit.fromSymbol("s"))
        assertEquals(Suit.HEARTS, Suit.fromSymbol("h"))
        assertEquals(Suit.DIAMONDS, Suit.fromSymbol("d"))
        assertEquals(Suit.CLUBS, Suit.fromSymbol("c"))
    }

    @Test
    fun `suit fromSymbol is case insensitive`() {
        assertEquals(Suit.SPADES, Suit.fromSymbol("S"))
        assertEquals(Suit.HEARTS, Suit.fromSymbol("H"))
        assertEquals(Suit.DIAMONDS, Suit.fromSymbol("D"))
        assertEquals(Suit.CLUBS, Suit.fromSymbol("C"))
    }

    @Test
    fun `suit fromSymbol throws for invalid input`() {
        assertThrows<IllegalArgumentException> { Suit.fromSymbol("x") }
        assertThrows<IllegalArgumentException> { Suit.fromSymbol("sp") }
        assertThrows<IllegalArgumentException> { Suit.fromSymbol("") }
        assertThrows<IllegalArgumentException> { Suit.fromSymbol("spades") }
        assertThrows<IllegalArgumentException> { Suit.fromSymbol("♠") }
    }

    // =========================================================================
    // Suit.fromDisplayName tests - Full name only
    // =========================================================================

    @Test
    fun `fromDisplayName returns correct suit for display name`() {
        assertEquals(Suit.SPADES, Suit.fromDisplayName("spades"))
        assertEquals(Suit.HEARTS, Suit.fromDisplayName("hearts"))
        assertEquals(Suit.DIAMONDS, Suit.fromDisplayName("diamonds"))
        assertEquals(Suit.CLUBS, Suit.fromDisplayName("clubs"))
    }

    @Test
    fun `suit fromDisplayName is case insensitive`() {
        assertEquals(Suit.SPADES, Suit.fromDisplayName("SPADES"))
        assertEquals(Suit.HEARTS, Suit.fromDisplayName("Hearts"))
        assertEquals(Suit.DIAMONDS, Suit.fromDisplayName("DIAMONDS"))
        assertEquals(Suit.CLUBS, Suit.fromDisplayName("clubs"))
    }

    @Test
    fun `suit fromDisplayName throws for invalid input`() {
        assertThrows<IllegalArgumentException> { Suit.fromDisplayName("s") }
        assertThrows<IllegalArgumentException> { Suit.fromDisplayName("♠") }
        assertThrows<IllegalArgumentException> { Suit.fromDisplayName("") }
        assertThrows<IllegalArgumentException> { Suit.fromDisplayName("spade") }
    }

    // =========================================================================
    // Card creation and notation tests
    // =========================================================================

    @Test
    fun `card notation is correct`() {
        val aceOfSpades = Card(Rank.ACE, Suit.SPADES)
        assertEquals("As", aceOfSpades.notation)

        val tenOfHearts = Card(Rank.TEN, Suit.HEARTS)
        assertEquals("Th", tenOfHearts.notation)

        val twoOfClubs = Card(Rank.TWO, Suit.CLUBS)
        assertEquals("2c", twoOfClubs.notation)
    }

    @Test
    fun `card fromNotation creates correct card`() {
        val aceOfSpades = Card.fromNotation("As")
        assertEquals(Rank.ACE, aceOfSpades.rank)
        assertEquals(Suit.SPADES, aceOfSpades.suit)

        val tenOfHearts = Card.fromNotation("Th")
        assertEquals(Rank.TEN, tenOfHearts.rank)
        assertEquals(Suit.HEARTS, tenOfHearts.suit)
    }

    @Test
    fun `card fromNotation throws for invalid notation`() {
        assertThrows<IllegalArgumentException> { Card.fromNotation("A") }
        assertThrows<IllegalArgumentException> { Card.fromNotation("Ace") }
        assertThrows<IllegalArgumentException> { Card.fromNotation("As1") }
    }

    @Test
    fun `card toDto produces correct output`() {
        val card = Card(Rank.KING, Suit.DIAMONDS)
        val dto = card.toDto()

        assertEquals("K", dto.rank)
        assertEquals("diamonds", dto.suit)
        assertEquals("Kd", dto.display)
    }
}

