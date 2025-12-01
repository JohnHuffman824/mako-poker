package com.mako.service

import com.mako.model.Card
import com.mako.model.PotWinnerResult
import com.mako.model.SidePot
import org.springframework.stereotype.Service

/**
 * Player data needed for showdown evaluation.
 */
data class ShowdownPlayer(
    val seatIndex: Int,
    val holeCards: List<Card>,
    val isFolded: Boolean
)

/**
 * Complete showdown result with all pot distributions.
 */
data class ShowdownResult(
    val potWinners: List<PotWinnerResult>,
    val playerRankings: Map<Int, HandResult>,
    val totalDistributed: Double
)

/**
 * Handles showdown logic and winner determination.
 *
 * Separates hand evaluation from pot distribution:
 * 1. Evaluate each player's hand once
 * 2. For each pot, find best hand among eligible players
 * 3. Split pots if there are ties
 */
@Service
class ShowdownService {

    /**
     * Determines winners for all pots at showdown.
     *
     * @param players All players who were dealt cards
     * @param communityCards The 5 community cards
     * @param pots All pots (main + side pots)
     * @return Complete showdown result with distributions
     */
    fun determineWinners(
        players: List<ShowdownPlayer>,
        communityCards: List<Card>,
        pots: List<SidePot>
    ): ShowdownResult {
        // Filter to non-folded players
        val activePlayers = players.filter { !it.isFolded }

        if (activePlayers.isEmpty()) {
            return ShowdownResult(
                potWinners = emptyList(),
                playerRankings = emptyMap(),
                totalDistributed = 0.0
            )
        }

        // Evaluate each active player's hand once
        val playerHands = activePlayers.associate { player ->
            player.seatIndex to HandEvaluator.evaluate(
                player.holeCards,
                communityCards
            )
        }

        // Determine winners for each pot
        val potWinners = pots.map { pot ->
            determinePotWinner(pot, playerHands)
        }

        val totalDistributed = potWinners.sumOf {
            it.amountPerWinner * it.winnerSeats.size
        }

        return ShowdownResult(
            potWinners = potWinners,
            playerRankings = playerHands,
            totalDistributed = totalDistributed
        )
    }

    /**
     * Determines winner(s) for a single pot.
     *
     * @param pot The pot to distribute
     * @param playerHands Map of seat index to evaluated hand
     * @return Winner result with amount per winner
     */
    private fun determinePotWinner(
        pot: SidePot,
        playerHands: Map<Int, HandResult>
    ): PotWinnerResult {
        // Only eligible players can win this pot
        val eligibleHands = playerHands.filterKeys { it in pot.eligiblePlayerSeats }

        if (eligibleHands.isEmpty()) {
            // No eligible players (shouldn't happen in normal play)
            return PotWinnerResult(
                pot = pot,
                winnerSeats = emptyList(),
                amountPerWinner = 0.0,
                handDescription = "No eligible players"
            )
        }

        // Find the best hand rank among eligible players
        val bestRank = eligibleHands.values.maxOf { it.absoluteRank }

        // Find all players with the best hand (handles ties)
        val winners = eligibleHands
            .filter { it.value.absoluteRank == bestRank }
            .keys
            .toList()

        val bestHand = eligibleHands[winners.first()]!!

        return PotWinnerResult(
            pot = pot,
            winnerSeats = winners,
            amountPerWinner = pot.amount / winners.size,
            handDescription = bestHand.description
        )
    }

    /**
     * Determines single winner when all others have folded.
     * No hand evaluation needed - last player standing wins.
     *
     * @param winnerSeatIndex The non-folded player's seat
     * @param pots All pots to award
     * @return Showdown result with all pots going to winner
     */
    fun determineWinnerByFold(
        winnerSeatIndex: Int,
        pots: List<SidePot>
    ): ShowdownResult {
        val potWinners = pots.map { pot ->
            PotWinnerResult(
                pot = pot,
                winnerSeats = listOf(winnerSeatIndex),
                amountPerWinner = pot.amount,
                handDescription = "Others folded"
            )
        }

        return ShowdownResult(
            potWinners = potWinners,
            playerRankings = emptyMap(),
            totalDistributed = pots.sumOf { it.amount }
        )
    }

    /**
     * Gets ranked list of players by hand strength.
     * Useful for displaying final standings.
     *
     * @param playerHands Evaluated hands from showdown
     * @return List of seat indices ordered by hand strength (best first)
     */
    fun getRankedPlayers(playerHands: Map<Int, HandResult>): List<Int> {
        return playerHands.entries
            .sortedByDescending { it.value.absoluteRank }
            .map { it.key }
    }
}

