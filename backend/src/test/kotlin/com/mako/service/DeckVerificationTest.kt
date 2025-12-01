package com.mako.service

import com.mako.model.Rank
import com.mako.model.Suit
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * Verifies deck creation produces exactly 52 unique cards.
 */
@DisplayName("Deck Verification Tests")
class DeckVerificationTest {

    @Test
    @DisplayName("createStandardDeck produces exactly 52 cards")
    fun testDeckSize() {
        val deck = GameConstants.createStandardDeck()
        assertEquals(52, deck.size, "Deck should have exactly 52 cards")
    }

    @Test
    @DisplayName("createStandardDeck produces all unique cards")
    fun testDeckUniqueness() {
        val deck = GameConstants.createStandardDeck()
        val notations = deck.map { it.notation }
        val uniqueNotations = notations.toSet()

        assertEquals(52, uniqueNotations.size,
            "All 52 cards should be unique. Found duplicates: ${
                notations.groupingBy { it }.eachCount().filter { it.value > 1 }
            }")
    }

    @Test
    @DisplayName("Deck contains all 13 ranks")
    fun testDeckHasAllRanks() {
        val deck = GameConstants.createStandardDeck()
        val ranks = deck.map { it.rank }.toSet()

        assertEquals(13, ranks.size, "Deck should have all 13 ranks")
        assertTrue(ranks.contains(Rank.TWO))
        assertTrue(ranks.contains(Rank.ACE))
        assertTrue(ranks.contains(Rank.KING))
    }

    @Test
    @DisplayName("Deck contains all 4 suits")
    fun testDeckHasAllSuits() {
        val deck = GameConstants.createStandardDeck()
        val suits = deck.map { it.suit }.toSet()

        assertEquals(4, suits.size, "Deck should have all 4 suits")
        assertTrue(suits.contains(Suit.SPADES))
        assertTrue(suits.contains(Suit.HEARTS))
        assertTrue(suits.contains(Suit.DIAMONDS))
        assertTrue(suits.contains(Suit.CLUBS))
    }

    @Test
    @DisplayName("Each rank-suit combination appears exactly once")
    fun testEachCombinationOnce() {
        val deck = GameConstants.createStandardDeck()

        for (rank in Rank.entries) {
            for (suit in Suit.entries) {
                val matchingCards = deck.filter {
                    it.rank == rank && it.suit == suit
                }
                assertEquals(1, matchingCards.size,
                    "Should have exactly one ${rank.symbol}${suit.symbol}")
            }
        }
    }

    @Test
    @DisplayName("Multiple deck creations are independent")
    fun testMultipleDecksAreIndependent() {
        val deck1 = GameConstants.createStandardDeck()
        val deck2 = GameConstants.createStandardDeck()

        // Decks should have same cards but be different objects
        assertEquals(deck1.size, deck2.size)

        // Remove cards from deck1
        deck1.removeAt(0)
        deck1.removeAt(0)

        // deck2 should still have 52 cards
        assertEquals(52, deck2.size,
            "Removing from one deck shouldn't affect another")
    }

    @Test
    @DisplayName("Dealing from deck removes cards properly")
    fun testDealingRemovesCards() {
        val deck = GameConstants.createStandardDeck()
        val originalSize = deck.size

        val card1 = deck.removeAt(0)
        assertEquals(originalSize - 1, deck.size)

        val card2 = deck.removeAt(0)
        assertEquals(originalSize - 2, deck.size)

        // Cards should be different
        assertNotEquals(card1.notation, card2.notation,
            "Dealt cards should be unique")
    }

    @Test
    @DisplayName("Cannot deal same card twice from same deck")
    fun testCannotDealSameCardTwice() {
        val deck = GameConstants.createStandardDeck()
        val dealtCards = mutableSetOf<String>()

        // Deal all 52 cards
        while (deck.isNotEmpty()) {
            val card = deck.removeAt(0)
            val notation = card.notation

            assertFalse(dealtCards.contains(notation),
                "Card $notation was dealt twice!")
            dealtCards.add(notation)
        }

        assertEquals(52, dealtCards.size, "Should have dealt 52 unique cards")
        assertEquals(0, deck.size, "Deck should be empty after dealing all cards")
    }
}

