package com.mako.enums

/**
 * Betting streets in Hold'em.
 * Each street represents a distinct phase of betting.
 */
enum class Street {
    PREFLOP,
    FLOP,
    TURN,
    RIVER;

    /**
     * Number of community cards dealt by this street.
     */
    val communityCardCount: Int
        get() = when (this) {
            PREFLOP -> 0
            FLOP -> 3
            TURN -> 4
            RIVER -> 5
        }

    /**
     * Returns the next street, or null if at river.
     */
    fun nextStreet(): Street? = when (this) {
        PREFLOP -> FLOP
        FLOP -> TURN
        TURN -> RIVER
        RIVER -> null
    }
}

/**
 * Player positions at the poker table.
 * Positions are listed in order of action postflop (early to late).
 */
enum class Position {
    // Early positions
    UTG,      // Under the Gun (first to act preflop after blinds)
    UTG_1,    // UTG+1

    // Middle positions
    MP,       // Middle Position
    MP_1,     // Middle Position +1
    HJ,       // Hijack (2 before button)

    // Late positions
    CO,       // Cutoff (1 before button)
    BTN,      // Button (dealer, best position)

    // Blinds
    SB,       // Small Blind
    BB;       // Big Blind

    /**
     * Returns true if this is a blind position.
     */
    val isBlind: Boolean
        get() = this == SB || this == BB

    /**
     * Returns true if this is a late position (CO, BTN).
     */
    val isLate: Boolean
        get() = this == CO || this == BTN

    /**
     * Returns true if this is an early position (UTG, UTG_1).
     */
    val isEarly: Boolean
        get() = this == UTG || this == UTG_1
}

/**
 * Possible poker actions.
 * Represents the actions a player can take on their turn.
 */
enum class PokerAction {
    FOLD,
    CHECK,
    CALL,
    BET,
    RAISE,
    ALL_IN;

    /**
     * Returns true if this is an aggressive action (bet/raise/all-in).
     */
    val isAggressive: Boolean
        get() = this == BET || this == RAISE || this == ALL_IN

    /**
     * Returns true if this is a passive action (check/call).
     */
    val isPassive: Boolean
        get() = this == CHECK || this == CALL

    /**
     * Returns true if this action requires a bet amount.
     */
    val requiresAmount: Boolean
        get() = this == BET || this == RAISE || this == ALL_IN
}

/**
 * Available actions for a player on their turn.
 * Determines what buttons/options the UI should show.
 */
enum class AvailableActions {
    /** Player cannot act - folded, all-in, or waiting */
    NONE,

    /** No bet to face - can check, bet, or fold */
    CHECK_BET_FOLD,

    /** Facing a bet - must call, raise, or fold */
    CALL_RAISE_FOLD,

    /** Big blind special case - can check or raise after limps */
    CHECK_RAISE_FOLD
}

