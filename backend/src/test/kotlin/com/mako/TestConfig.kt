package com.mako

import com.mako.model.Card
import com.mako.model.Rank
import com.mako.model.Suit

/**
 * Shared test utilities for poker game tests.
 * Provides helper methods for creating cards, players, and test scenarios.
 */
object TestHelpers {

    /**
     * Creates a card from Rank and Suit enums.
     */
    fun card(rank: Rank, suit: Suit): Card = Card(rank, suit)

    /**
     * Creates cards using a shorthand notation.
     * Format: "AH" = Ace of Hearts, "KS" = King of Spades
     *
     * @param cards Space-separated card strings (e.g., "AH KH QH JH TH")
     */
    fun cards(cards: String): List<Card> {
        return cards.split(" ")
            .filter { it.isNotBlank() }
            .map { parseCard(it) }
    }

    /**
     * Parses a card string like "AH" into a Card object.
     */
    private fun parseCard(cardStr: String): Card {
        require(cardStr.length == 2) { "Card string must be 2 characters" }
        val rankChar = cardStr[0].uppercaseChar()
        val suitChar = cardStr[1].uppercaseChar()

        val rank = when (rankChar) {
            'A' -> Rank.ACE
            'K' -> Rank.KING
            'Q' -> Rank.QUEEN
            'J' -> Rank.JACK
            'T' -> Rank.TEN
            '9' -> Rank.NINE
            '8' -> Rank.EIGHT
            '7' -> Rank.SEVEN
            '6' -> Rank.SIX
            '5' -> Rank.FIVE
            '4' -> Rank.FOUR
            '3' -> Rank.THREE
            '2' -> Rank.TWO
            else -> throw IllegalArgumentException("Invalid rank: $rankChar")
        }

        val suit = when (suitChar) {
            'H' -> Suit.HEARTS
            'D' -> Suit.DIAMONDS
            'C' -> Suit.CLUBS
            'S' -> Suit.SPADES
            else -> throw IllegalArgumentException("Invalid suit: $suitChar")
        }

        return Card(rank, suit)
    }

    /**
     * Creates a list of 7 cards from hole cards and community cards.
     *
     * @param hole Hole cards string (e.g., "AH KH")
     * @param community Community cards string (e.g., "QH JH TH 9H 8H")
     */
    fun sevenCards(hole: String, community: String): List<Card> {
        return cards("$hole $community")
    }
}
