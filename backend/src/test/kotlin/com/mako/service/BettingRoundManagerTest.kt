package com.mako.service

import com.mako.dto.BlindsDto
import com.mako.model.AiPlayer
import com.mako.model.AvailableActions
import com.mako.model.PokerPlayer
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName

/**
 * Comprehensive tests for BettingRoundManager.
 * Tests betting round initialization, action processing, and completion detection.
 */
@DisplayName("BettingRoundManager Tests")
class BettingRoundManagerTest {

	private lateinit var actionOrderManager: ActionOrderManager
	private lateinit var bettingRoundManager: BettingRoundManager

	@BeforeEach
	fun setup() {
		actionOrderManager = ActionOrderManager()
		bettingRoundManager = BettingRoundManager(actionOrderManager)
	}

	// =========================================================================
	// 5.1 Betting Round Start (4 tests)
	// =========================================================================

	@Test
	@DisplayName("Preflop: Blinds posted, action to UTG")
	fun testPreflopStart() {
		val players = mutableListOf(
			createAiPlayer(1), // SB
			createAiPlayer(2), // BB
			createAiPlayer(3), // UTG
			createAiPlayer(0)  // BTN
		)
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.startBettingRound(
			players, availableActions, blinds, isPreflop = true
		)

		// Verify blinds posted
		assertEquals(1.5, result.pot, 0.001, "Pot should be SB + BB")
		assertEquals(1.0, result.lastBet, 0.001, "Last bet should be BB")
		assertEquals(2.0, result.minRaise, 0.001, "Min raise should be 2x BB")

		// Verify first to act is UTG (index 2)
		assertEquals(2, result.firstActorIndex, "UTG should act first")

		// Verify blinds marked on players
		assertEquals("SB", players[0].lastAction)
		assertEquals("BB", players[1].lastAction)
		assertEquals(0.5, players[0].currentBet, 0.001)
		assertEquals(1.0, players[1].currentBet, 0.001)
	}

	@Test
	@DisplayName("Post-flop: Bets reset, action to SB")
	fun testPostFlopStart() {
		val players = mutableListOf(
			createAiPlayer(1), // SB
			createAiPlayer(2), // BB
			createAiPlayer(3)
		)

		// Set some previous bets
		players[0].currentBet = 10.0
		players[1].currentBet = 10.0
		players[2].currentBet = 10.0
		players[0].lastAction = "Call"
		players[1].lastAction = "Check"

		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.startBettingRound(
			players, availableActions, blinds, isPreflop = false
		)

		// Verify bets reset
		assertEquals(0.0, players[0].currentBet, 0.001, "Bets should reset")
		assertEquals(0.0, players[1].currentBet, 0.001)
		assertEquals(0.0, players[2].currentBet, 0.001)
		assertNull(players[0].lastAction, "Last action should reset")

		// Verify action to SB (index 0)
		assertEquals(0, result.firstActorIndex, "SB should act first post-flop")
	}

	@Test
	@DisplayName("Pot calculation after blinds")
	fun testPotCalculation() {
		val players = mutableListOf(
			createAiPlayer(0),
			createAiPlayer(1)
		)
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(2.0, 4.0)

		val result = bettingRoundManager.startBettingRound(
			players, availableActions, blinds, isPreflop = true
		)

		assertEquals(6.0, result.pot, 0.001, "Pot should be 2 + 4 = 6")
	}

	@Test
	@DisplayName("minRaise set to 2x BB preflop")
	fun testMinRaisePreflop() {
		val players = mutableListOf(
			createAiPlayer(0),
			createAiPlayer(1),
			createAiPlayer(2)
		)
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.startBettingRound(
			players, availableActions, blinds, isPreflop = true
		)

		assertEquals(2.0, result.minRaise, 0.001,
			"Min raise should be 2x BB")
	}

	// =========================================================================
	// 5.2 Action Processing (8 tests)
	// =========================================================================

	@Test
	@DisplayName("Fold: Player marked folded, pot unchanged")
	fun testFoldAction() {
		val player = createAiPlayer(0)
		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "fold", null,
			10.0, 5.0, 10.0, -1, blinds, "flop"
		)

		assertTrue(player.isFolded, "Player should be folded")
		assertEquals("Fold", player.lastAction)
		assertEquals(10.0, result.pot, 0.001, "Pot should be unchanged")
	}

	@Test
	@DisplayName("Check: LastAction updated, pot unchanged")
	fun testCheckAction() {
		val player = createAiPlayer(0)
		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "check", null,
			10.0, 0.0, 2.0, -1, blinds, "flop"
		)

		assertEquals("Check", player.lastAction)
		assertEquals(10.0, result.pot, 0.001, "Pot should be unchanged")
	}

	@Test
	@DisplayName("Call: Stack decremented, pot increased, currentBet updated")
	fun testCallAction() {
		val player = createAiPlayer(0)
		player.stack = 100.0
		player.currentBet = 0.0

		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "call", null,
			10.0, 5.0, 10.0, -1, blinds, "flop"
		)

		assertEquals(95.0, player.stack, 0.001, "Stack should decrease by 5")
		assertEquals(5.0, player.currentBet, 0.001, "Current bet should be 5")
		assertEquals(15.0, result.pot, 0.001, "Pot should increase by 5")
		assertEquals("Call", player.lastAction)
	}

	@Test
	@DisplayName("Raise: All bet state updated, lastAggressor set")
	fun testRaiseAction() {
		val player = createAiPlayer(0)
		player.stack = 100.0
		player.currentBet = 0.0

		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		// Raise from lastBet=5.0 to 10.0 (raise of 5.0)
		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "raise", 10.0,
			5.0, 5.0, 10.0, -1, blinds, "flop"
		)

		assertEquals(10.0, player.currentBet, 0.001)
		assertEquals(15.0, result.pot, 0.001)
		assertEquals(10.0, result.lastBet, 0.001)
		assertEquals(5.0, result.minRaise, 0.001,
			"MinRaise should be size of raise (5.0)")
		assertEquals(0, result.lastAggressorIndex)
		assertTrue(player.lastAction!!.startsWith("RAISE"))
	}

	@Test
	@DisplayName("All-in less than call: Call amount capped at stack")
	fun testAllInLessThanCall() {
		val player = createAiPlayer(0)
		player.stack = 3.0
		player.currentBet = 0.0

		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "call", null,
			10.0, 5.0, 10.0, -1, blinds, "flop"
		)

		assertEquals(0.0, player.stack, 0.001, "Stack should be 0")
		assertEquals(3.0, player.currentBet, 0.001, "Bet should be capped at 3")
		assertEquals(13.0, result.pot, 0.001, "Pot should increase by 3")
		assertTrue(player.isAllIn, "Player should be all-in")
		assertEquals("All-in", player.lastAction)
	}

	@Test
	@DisplayName("All-in raise: Becomes aggressor if exceeds lastBet")
	fun testAllInRaise() {
		val player = createAiPlayer(0)
		player.stack = 20.0
		player.currentBet = 0.0

		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "allin", null,
			10.0, 5.0, 10.0, -1, blinds, "flop"
		)

		assertEquals(0, result.lastAggressorIndex, "Should be aggressor")
		assertEquals(20.0, result.lastBet, 0.001, "Last bet should be 20")
		assertTrue(result.minRaise > 20.0, "Min raise should increase")
	}

	@Test
	@DisplayName("Min raise enforcement: Can't raise less than minRaise")
	fun testMinRaiseEnforcement() {
		val player = createAiPlayer(0)
		player.stack = 100.0
		player.currentBet = 0.0

		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		// Try to raise to 6 when minRaise is 10
		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "raise", 6.0,
			5.0, 5.0, 10.0, -1, blinds, "flop"
		)

		// Should enforce minRaise of 10
		assertTrue(player.currentBet >= 10.0, "Should enforce min raise")
	}

	@Test
	@DisplayName("Re-raise: Correctly updates minRaise")
	fun testReRaiseMinRaise() {
		val player = createAiPlayer(0)
		player.stack = 100.0
		player.currentBet = 0.0

		val actionOrder = mutableListOf(player, createAiPlayer(1))
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		// Raise from 5 to 15 (raise of 10)
		val result = bettingRoundManager.processAction(
			actionOrder, availableActions, 0, "raise", 15.0,
			10.0, 5.0, 10.0, -1, blinds, "flop"
		)

		assertEquals(15.0, result.lastBet, 0.001)
		// Min raise should be size of this raise = 10
		// Next player must raise by at least 10 (to 25 total)
		assertEquals(10.0, result.minRaise, 0.001,
			"Min raise should equal size of previous raise")
	}

	// =========================================================================
	// 5.3 Round Completion (4 tests)
	// =========================================================================

	@Test
	@DisplayName("All players checked: Round complete")
	fun testAllPlayersChecked() {
		val players = listOf(
			createAiPlayer(0).apply { lastAction = "Check" },
			createAiPlayer(1).apply { lastAction = "Check" },
			createAiPlayer(2).apply { lastAction = "Check" }
		)

		val isComplete = bettingRoundManager.isBettingRoundComplete(
			players, 0.0
		)

		assertTrue(isComplete, "Round should be complete when all checked")
	}

	@Test
	@DisplayName("All called after raise: Round complete")
	fun testAllCalledAfterRaise() {
		val players = listOf(
			createAiPlayer(0).apply {
				lastAction = "Raise 10BB"
				currentBet = 10.0
			},
			createAiPlayer(1).apply {
				lastAction = "Call"
				currentBet = 10.0
			},
			createAiPlayer(2).apply {
				lastAction = "Call"
				currentBet = 10.0
			}
		)

		val isComplete = bettingRoundManager.isBettingRoundComplete(
			players, 10.0
		)

		assertTrue(isComplete, "Round should be complete when all matched bet")
	}

	@Test
	@DisplayName("Player still needs to act: Round not complete")
	fun testPlayerNeedsToAct() {
		val players = listOf(
			createAiPlayer(0).apply {
				lastAction = "Raise 10BB"
				currentBet = 10.0
			},
			createAiPlayer(1).apply {
				lastAction = "BB" // Hasn't acted yet
				currentBet = 1.0
			}
		)

		val isComplete = bettingRoundManager.isBettingRoundComplete(
			players, 10.0
		)

		assertFalse(isComplete, 
			"Round not complete when player hasn't acted")
	}

	@Test
	@DisplayName("One player left (others folded): Round complete")
	fun testOnlyOnePlayerActive() {
		val players = listOf(
			createAiPlayer(0).apply { isFolded = false },
			createAiPlayer(1).apply { isFolded = true },
			createAiPlayer(2).apply { isFolded = true }
		)

		val isComplete = bettingRoundManager.isBettingRoundComplete(
			players, 5.0
		)

		assertTrue(isComplete, 
			"Round complete when only one player active")
	}

	// =========================================================================
	// Additional Edge Cases
	// =========================================================================

	@Test
	@DisplayName("All-in players don't block round completion")
	fun testAllInDoesntBlockCompletion() {
		val players = listOf(
			createAiPlayer(0).apply {
				lastAction = "Raise 10BB"
				currentBet = 10.0
			},
			createAiPlayer(1).apply {
				lastAction = "All-in"
				currentBet = 10.0
				isAllIn = true
			},
			createAiPlayer(2).apply {
				lastAction = "Call"
				currentBet = 10.0
			}
		)

		val isComplete = bettingRoundManager.isBettingRoundComplete(
			players, 10.0
		)

		assertTrue(isComplete, 
			"All-in players don't need to act again")
	}

	@Test
	@DisplayName("Heads-up preflop: Blinds posted correctly")
	fun testHeadsUpPreflop() {
		val players = mutableListOf(
			createAiPlayer(0), // BTN/SB
			createAiPlayer(1)  // BB
		)
		val availableActions = mutableMapOf<Int, AvailableActions>()
		val blinds = BlindsDto(0.5, 1.0)

		val result = bettingRoundManager.startBettingRound(
			players, availableActions, blinds, isPreflop = true
		)

		// BTN posts SB
		assertEquals("SB", players[0].lastAction)
		assertEquals(0.5, players[0].currentBet, 0.001)

		// Other player posts BB
		assertEquals("BB", players[1].lastAction)
		assertEquals(1.0, players[1].currentBet, 0.001)

		// Button acts first in heads-up
		assertEquals(0, result.firstActorIndex, "BTN acts first heads-up")
	}

	// =========================================================================
	// Helper Methods
	// =========================================================================

	private fun createAiPlayer(seatIndex: Int): PokerPlayer {
		return AiPlayer(
			seatIndex = seatIndex,
			position = "",
			stack = 100.0
		)
	}
}

