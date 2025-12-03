package com.mako.model

import com.mako.dto.CardDto
import com.mako.enums.Rank
import com.mako.enums.Suit

/**
 * Represents a playing card with type-safe rank and suit.
 *
 * @property rank Card rank (TWO through ACE)
 * @property suit Card suit (SPADES, HEARTS, DIAMONDS, CLUBS)
 */
data class Card(
    val rank: Rank,
    val suit: Suit
) {
    /**
     * Short notation for the card (e.g., "As" for Ace of Spades).
     */
    val notation: String get() = "${rank.symbol}${suit.symbol}"

    /**
     * Converts card to DTO for API response.
     * Uses display name for suit to match frontend expectations.
     */
    fun toDto(): CardDto = CardDto(
        rank = rank.symbol,
        suit = suit.displayName,
        display = notation
    )

    override fun toString(): String = notation

    companion object {
        /**
         * Creates card from notation string (e.g., "As", "Th").
         *
         * @param notation Two-character string: rank + suit
         * @return Card instance
         * @throws IllegalArgumentException if notation is invalid
         */
        fun fromNotation(notation: String): Card {
            require(notation.length == 2) {
                "Card notation must be 2 characters: $notation"
            }
            return Card(
                rank = Rank.fromSymbol(notation[0].toString()),
                suit = Suit.fromSymbol(notation[1].toString())
            )
        }
    }
}
