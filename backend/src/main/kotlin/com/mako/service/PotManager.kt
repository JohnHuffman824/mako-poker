package com.mako.service

import com.mako.model.SidePot
import org.springframework.stereotype.Service

/**
 * Manages pot creation and calculation for all-in scenarios.
 *
 * Side pot creation rules:
 * 1. Main pot: All players contribute up to smallest all-in amount
 * 2. Side pot 1: Players with more than smallest all-in contribute
 *    up to next all-in amount
 * 3. Continue for each all-in amount level
 *
 * Example: Players A(100), B(50 all-in), C(200)
 * - Main pot: 50 * 3 = 150 (A, B, C eligible)
 * - Side pot: 50 * 2 = 100 (A, C eligible - B can't win this)
 */
@Service
class PotManager {

    /**
     * Calculates and creates all pots based on player contributions.
     * Should be called at showdown to determine pot distribution.
     *
     * @param contributions Map of seat index to total contributed this hand
     * @param activeSeats Set of seat indices for players not folded
     * @return List of pots from main pot to final side pot
     */
    fun calculatePots(
        contributions: Map<Int, Double>,
        activeSeats: Set<Int>
    ): List<SidePot> {
        val activeContributions = contributions.filterKeys {
            it in activeSeats
        }

        if (activeContributions.isEmpty()) {
            return emptyList()
        }

        val contributionLevels = getContributionLevels(contributions)
        if (contributionLevels.isEmpty()) {
            return emptyList()
        }

        return buildPotsFromLevels(
            contributionLevels,
            contributions,
            activeContributions
        )
    }

    /**
     * Extracts unique contribution levels from all contributions.
     */
    private fun getContributionLevels(
        contributions: Map<Int, Double>
    ): List<Double> {
        return contributions.values
            .filter { it > 0 }
            .distinct()
            .sorted()
    }

    /**
     * Builds side pots from contribution levels.
     */
    private fun buildPotsFromLevels(
        levels: List<Double>,
        allContributions: Map<Int, Double>,
        activeContributions: Map<Int, Double>
    ): List<SidePot> {
        val pots = mutableListOf<SidePot>()
        var previousCap = 0.0
        var potId = 0

        for (cap in levels) {
            val pot = createPotAtLevel(
                cap,
                previousCap,
                potId,
                allContributions,
                activeContributions
            )

            pot?.let {
                pots.add(it)
                potId++
            }

            previousCap = cap
        }

        return pots
    }

    /**
     * Creates a single pot at a specific contribution level.
     */
    private fun createPotAtLevel(
        cap: Double,
        previousCap: Double,
        potId: Int,
        allContributions: Map<Int, Double>,
        activeContributions: Map<Int, Double>
    ): SidePot? {
        val contributionAtLevel = cap - previousCap

        if (contributionAtLevel <= 0) return null

        val contributorsAtLevel = allContributions
            .count { it.value > previousCap }

        if (contributorsAtLevel == 0) return null

        val potAmount = contributionAtLevel * contributorsAtLevel
        val eligibleSeats = findEligibleSeats(
            cap,
            previousCap,
            activeContributions
        )

        if (eligibleSeats.isEmpty() || potAmount <= 0) return null

        return SidePot(
            id = potId,
            amount = potAmount,
            eligiblePlayerSeats = eligibleSeats,
            capPerPlayer = cap
        )
    }

    /**
     * Finds players eligible for a pot at this level.
     */
    private fun findEligibleSeats(
        cap: Double,
        previousCap: Double,
        activeContributions: Map<Int, Double>
    ): MutableSet<Int> {
        val eligibleSeats = activeContributions
            .filter { it.value >= cap }
            .keys
            .toMutableSet()

        activeContributions
            .filter { it.value == cap && it.value > previousCap }
            .keys
            .forEach { eligibleSeats.add(it) }

        return eligibleSeats
    }

    /**
     * Calculates total pot from all contributions.
     * Simple sum - doesn't account for eligibility.
     */
    fun calculateTotalPot(contributions: Map<Int, Double>): Double =
        contributions.values.sum()

    /**
     * Creates a simple single pot when no all-ins occurred.
     * All active players are eligible.
     */
    fun createSimplePot(
        totalAmount: Double,
        activeSeats: Set<Int>
    ): List<SidePot> {
        if (totalAmount <= 0 || activeSeats.isEmpty()) {
            return emptyList()
        }

        return listOf(
            SidePot(
                id = 0,
                amount = totalAmount,
                eligiblePlayerSeats = activeSeats.toMutableSet(),
                capPerPlayer = totalAmount
            )
        )
    }

    /**
     * Adds a contribution to tracking map.
     * Updates running total for the given seat.
     */
    fun recordContribution(
        contributions: MutableMap<Int, Double>,
        seatIndex: Int,
        amount: Double
    ) {
        val current = contributions[seatIndex] ?: 0.0
        contributions[seatIndex] = current + amount
    }

    /**
     * Resets contribution tracking for a new hand.
     */
    fun resetContributions(contributions: MutableMap<Int, Double>) {
        contributions.clear()
    }
}

