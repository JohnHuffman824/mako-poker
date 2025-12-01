package com.mako.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Tests for PotManager service.
 *
 * Tests cover:
 * - Simple pot (no all-ins)
 * - Single all-in creating two pots
 * - Multiple all-ins at different levels
 * - Folded players not eligible
 * - Edge cases with equal contributions
 */
class PotManagerTest {

    private lateinit var potManager: PotManager

    @BeforeEach
    fun setup() {
        potManager = PotManager()
    }

    // =========================================================================
    // Simple pot tests (no all-ins)
    // =========================================================================

    @Test
    fun `createSimplePot creates single main pot with all active players`() {
        val activeSeats = setOf(0, 1, 2)
        val pots = potManager.createSimplePot(100.0, activeSeats)

        assertEquals(1, pots.size)
        assertEquals(0, pots[0].id)
        assertEquals(100.0, pots[0].amount)
        assertTrue(pots[0].isMainPot)
        assertEquals(activeSeats, pots[0].eligiblePlayerSeats)
    }

    @Test
    fun `createSimplePot returns empty list for zero amount`() {
        val pots = potManager.createSimplePot(0.0, setOf(0, 1))
        assertTrue(pots.isEmpty())
    }

    @Test
    fun `createSimplePot returns empty list for no active seats`() {
        val pots = potManager.createSimplePot(100.0, emptySet())
        assertTrue(pots.isEmpty())
    }

    // =========================================================================
    // Single all-in creating side pot
    // =========================================================================

    @Test
    fun `single all-in creates main pot and side pot`() {
        // Player A: 100, Player B: 50 (all-in), Player C: 100
        // Main pot: 50 * 3 = 150 (A, B, C eligible)
        // Side pot: 50 * 2 = 100 (A, C eligible)
        val contributions = mapOf(
            0 to 100.0, // Player A
            1 to 50.0,  // Player B (all-in)
            2 to 100.0  // Player C
        )
        val activeSeats = setOf(0, 1, 2)

        val pots = potManager.calculatePots(contributions, activeSeats)

        assertEquals(2, pots.size)

        // Main pot
        val mainPot = pots[0]
        assertTrue(mainPot.isMainPot)
        assertEquals(150.0, mainPot.amount)
        assertEquals(setOf(0, 1, 2), mainPot.eligiblePlayerSeats)
        assertEquals(50.0, mainPot.capPerPlayer)

        // Side pot
        val sidePot = pots[1]
        assertEquals(1, sidePot.id)
        assertEquals(100.0, sidePot.amount)
        assertEquals(setOf(0, 2), sidePot.eligiblePlayerSeats)
        assertEquals(100.0, sidePot.capPerPlayer)
    }

    // =========================================================================
    // Multiple all-ins at different levels
    // =========================================================================

    @Test
    fun `multiple all-ins create multiple side pots`() {
        // Player A: 200, Player B: 50 (all-in), Player C: 100 (all-in), D: 200
        // Pot 1: 50 * 4 = 200 (A, B, C, D eligible)
        // Pot 2: 50 * 3 = 150 (A, C, D eligible)
        // Pot 3: 100 * 2 = 200 (A, D eligible)
        val contributions = mapOf(
            0 to 200.0, // Player A
            1 to 50.0,  // Player B (all-in first)
            2 to 100.0, // Player C (all-in second)
            3 to 200.0  // Player D
        )
        val activeSeats = setOf(0, 1, 2, 3)

        val pots = potManager.calculatePots(contributions, activeSeats)

        assertEquals(3, pots.size)

        // First pot (0-50 level)
        assertEquals(200.0, pots[0].amount) // 50 * 4
        assertEquals(setOf(0, 1, 2, 3), pots[0].eligiblePlayerSeats)

        // Second pot (50-100 level)
        assertEquals(150.0, pots[1].amount) // 50 * 3 (A, C, D)
        assertEquals(setOf(0, 2, 3), pots[1].eligiblePlayerSeats)

        // Third pot (100-200 level)
        assertEquals(200.0, pots[2].amount) // 100 * 2 (A, D)
        assertEquals(setOf(0, 3), pots[2].eligiblePlayerSeats)
    }

    // =========================================================================
    // Folded players
    // =========================================================================

    @Test
    fun `folded players contribute to pot but are not eligible`() {
        // Player A: 100 (folded), Player B: 100, Player C: 100
        // All money goes to pot, but A can't win
        val contributions = mapOf(
            0 to 100.0, // Player A (folded)
            1 to 100.0, // Player B
            2 to 100.0  // Player C
        )
        val activeSeats = setOf(1, 2) // A is folded

        val pots = potManager.calculatePots(contributions, activeSeats)

        assertEquals(1, pots.size)
        assertEquals(300.0, pots[0].amount)
        assertEquals(setOf(1, 2), pots[0].eligiblePlayerSeats) // A not eligible
    }

    @Test
    fun `folded all-in player contributes but not eligible for any pot`() {
        // Player A: 50 (all-in then folded - edge case), B: 100, C: 100
        val contributions = mapOf(
            0 to 50.0,
            1 to 100.0,
            2 to 100.0
        )
        val activeSeats = setOf(1, 2) // A folded

        val pots = potManager.calculatePots(contributions, activeSeats)

        // A contributed but can't win
        assertEquals(2, pots.size)

        // First pot includes A's contribution
        assertEquals(150.0, pots[0].amount) // 50 * 3
        assertEquals(setOf(1, 2), pots[0].eligiblePlayerSeats) // A not eligible

        // Second pot
        assertEquals(100.0, pots[1].amount) // 50 * 2
        assertEquals(setOf(1, 2), pots[1].eligiblePlayerSeats)
    }

    // =========================================================================
    // Edge cases
    // =========================================================================

    @Test
    fun `equal contributions from all players creates single pot`() {
        val contributions = mapOf(
            0 to 50.0,
            1 to 50.0,
            2 to 50.0
        )
        val activeSeats = setOf(0, 1, 2)

        val pots = potManager.calculatePots(contributions, activeSeats)

        assertEquals(1, pots.size)
        assertEquals(150.0, pots[0].amount)
        assertEquals(setOf(0, 1, 2), pots[0].eligiblePlayerSeats)
    }

    @Test
    fun `multiple players all-in for same amount`() {
        // All three all-in for 50
        val contributions = mapOf(
            0 to 50.0,
            1 to 50.0,
            2 to 50.0
        )
        val activeSeats = setOf(0, 1, 2)

        val pots = potManager.calculatePots(contributions, activeSeats)

        assertEquals(1, pots.size)
        assertEquals(150.0, pots[0].amount)
        assertEquals(setOf(0, 1, 2), pots[0].eligiblePlayerSeats)
    }

    @Test
    fun `heads-up all-in creates correct pots`() {
        // Player A: 100, Player B: 50 (all-in)
        val contributions = mapOf(
            0 to 100.0,
            1 to 50.0
        )
        val activeSeats = setOf(0, 1)

        val pots = potManager.calculatePots(contributions, activeSeats)

        assertEquals(2, pots.size)

        // Main pot (B can win)
        assertEquals(100.0, pots[0].amount) // 50 * 2
        assertEquals(setOf(0, 1), pots[0].eligiblePlayerSeats)

        // Side pot (excess returned to A effectively)
        assertEquals(50.0, pots[1].amount) // 50 * 1
        assertEquals(setOf(0), pots[1].eligiblePlayerSeats)
    }

    @Test
    fun `empty contributions returns empty pot list`() {
        val pots = potManager.calculatePots(emptyMap(), setOf(0, 1))
        assertTrue(pots.isEmpty())
    }

    @Test
    fun `no active seats returns empty pot list`() {
        val contributions = mapOf(0 to 100.0, 1 to 100.0)
        val pots = potManager.calculatePots(contributions, emptySet())
        assertTrue(pots.isEmpty())
    }

    // =========================================================================
    // Contribution tracking
    // =========================================================================

    @Test
    fun `recordContribution adds to existing contribution`() {
        val contributions = mutableMapOf(0 to 50.0)
        potManager.recordContribution(contributions, 0, 50.0)
        assertEquals(100.0, contributions[0])
    }

    @Test
    fun `recordContribution creates new entry for new player`() {
        val contributions = mutableMapOf<Int, Double>()
        potManager.recordContribution(contributions, 0, 50.0)
        assertEquals(50.0, contributions[0])
    }

    @Test
    fun `resetContributions clears all entries`() {
        val contributions = mutableMapOf(0 to 100.0, 1 to 50.0)
        potManager.resetContributions(contributions)
        assertTrue(contributions.isEmpty())
    }

    @Test
    fun `calculateTotalPot returns sum of all contributions`() {
        val contributions = mapOf(0 to 100.0, 1 to 50.0, 2 to 75.0)
        assertEquals(225.0, potManager.calculateTotalPot(contributions))
    }
}

