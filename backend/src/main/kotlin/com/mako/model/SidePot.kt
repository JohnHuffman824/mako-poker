package com.mako.model

/**
 * Represents a pot (main or side) with its eligible players.
 *
 * Side pots are created when a player goes all-in and other players
 * continue betting. Each pot tracks:
 * - The amount in the pot
 * - Which players are eligible to win it
 * - The maximum contribution per player for this pot level
 *
 * Example scenario with 3 players:
 * - Player A has 100 chips, Player B has 50, Player C has 200
 * - All players go all-in
 * - Main pot: 50 * 3 = 150 (A, B, C eligible)
 * - Side pot: 50 * 2 = 100 (A, C eligible - B cannot win this)
 * - Side pot 2: 50 * 1 = 50 (C only - excess chips returned)
 */
data class SidePot(
    val id: Int,
    var amount: Double,
    val eligiblePlayerSeats: MutableSet<Int>,
    val capPerPlayer: Double
) {
    /**
     * Whether this is the main pot (first pot created).
     */
    val isMainPot: Boolean get() = id == 0

    /**
     * Display name for the pot.
     */
    val displayName: String
        get() = if (isMainPot) "Main Pot" else "Side Pot ${id}"

    /**
     * Checks if a player at the given seat can win this pot.
     */
    fun isPlayerEligible(seatIndex: Int): Boolean =
        seatIndex in eligiblePlayerSeats
}

/**
 * Result of pot distribution for a single pot.
 */
data class PotWinnerResult(
    val pot: SidePot,
    val winnerSeats: List<Int>,
    val amountPerWinner: Double,
    val handDescription: String
)

