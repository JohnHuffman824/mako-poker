package com.mako.enums

/**
 * Playing card ranks from lowest (TWO=2) to highest (ACE=14).
 * Numeric value used for hand evaluation and comparisons.
 *
 * @property value Numeric value for comparison (2-14)
 * @property symbol Single character representation (2-9, T, J, Q, K, A)
 */
enum class Rank(val value: Int, val symbol: String) {
    TWO(2, "2"),
    THREE(3, "3"),
    FOUR(4, "4"),
    FIVE(5, "5"),
    SIX(6, "6"),
    SEVEN(7, "7"),
    EIGHT(8, "8"),
    NINE(9, "9"),
    TEN(10, "T"),
    JACK(11, "J"),
    QUEEN(12, "Q"),
    KING(13, "K"),
    ACE(14, "A");

    companion object {
        private val bySymbol = entries.associateBy { it.symbol }
        private val byValue = entries.associateBy { it.value }

        /**
         * Creates Rank from symbol string (e.g., "A", "T", "2").
         * Case-insensitive.
         */
        fun fromSymbol(symbol: String): Rank =
            bySymbol[symbol.uppercase()]
                ?: throw IllegalArgumentException(
                    "Invalid rank symbol: $symbol"
                )

        /**
         * Creates Rank from numeric value (2-14).
         */
        fun fromValue(value: Int): Rank =
            byValue[value]
                ?: throw IllegalArgumentException("Invalid rank value: $value")
    }
}

/**
 * Playing card suits.
 * Suits have equal value in standard poker (no suit ranking).
 *
 * @property symbol Single character for notation (s, h, d, c)
 * @property displayName Full name matching frontend convention
 */
enum class Suit(val symbol: String, val displayName: String) {
    SPADES("s", "spades"),
    HEARTS("h", "hearts"),
    DIAMONDS("d", "diamonds"),
    CLUBS("c", "clubs");

    companion object {
        private val bySymbol = entries.associateBy { it.symbol }
        private val byDisplayName = entries.associateBy { it.displayName }

        /**
         * Creates Suit from single character symbol (s, h, d, c).
         * Case-insensitive. Fails fast on invalid input.
         */
        fun fromSymbol(symbol: String): Suit {
            val lower = symbol.lowercase()
            return bySymbol[lower]
                ?: throw IllegalArgumentException(
                    "Invalid suit symbol: $symbol. Expected: s, h, d, or c"
                )
        }

        /**
         * Creates Suit from display name (spades, hearts, diamonds, clubs).
         * Case-insensitive. Fails fast on invalid input.
         */
        fun fromDisplayName(name: String): Suit {
            val lower = name.lowercase()
            return byDisplayName[lower]
                ?: throw IllegalArgumentException(
                    "Invalid suit name: $name. " +
                    "Expected: spades, hearts, diamonds, or clubs"
                )
        }
    }
}

