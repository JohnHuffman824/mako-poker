package com.mako.service

import com.mako.model.AiPlayer
import com.mako.model.AvailableActions
import com.mako.model.HumanPlayer
import com.mako.model.PokerPlayer
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName

/**
 * Comprehensive tests for ActionOrderManager.
 * Tests player ordering, first-to-act logic, and available action calculation.
 */
@DisplayName("ActionOrderManager Tests")
class ActionOrderManagerTest {

	private lateinit var manager: ActionOrderManager

	@BeforeEach
	fun setup() {
		manager = ActionOrderManager()
	}

	// =========================================================================
	// 4.1 Action Order Building (5 tests)
	// =========================================================================

	@Test
	@DisplayName("Full ring: Order is SB, BB, UTG, ..., BTN (button last)")
	fun testFullRingActionOrder() {
		val players = mapOf(
			0 to createAiPlayer(0),
			1 to createAiPlayer(1),
			2 to createAiPlayer(2),
			3 to createAiPlayer(3),
			4 to createAiPlayer(4),
			5 to createAiPlayer(5)
		)
		val buttonSeat = 2

		val order = manager.buildActionOrder(players, buttonSeat)

		// Order should be: 3 (SB), 4 (BB), 5, 0, 1, 2 (BTN)
		assertEquals(6, order.size)
		assertEquals(3, order[0].seatIndex, "First should be SB (seat after button)")
		assertEquals(4, order[1].seatIndex, "Second should be BB")
		assertEquals(2, order[5].seatIndex, "Last should be button")
	}

	@Test
	@DisplayName("Heads-up: BTN/SB first, BB second")
	fun testHeadsUpActionOrder() {
		val players = mapOf(
			0 to createAiPlayer(0),
			3 to createAiPlayer(3)
		)
		val buttonSeat = 0

		val order = manager.buildActionOrder(players, buttonSeat)

		assertEquals(2, order.size)
		assertEquals(0, order[0].seatIndex, "BTN/SB should be first")
		assertEquals(3, order[1].seatIndex, "BB should be second")
	}

	@Test
	@DisplayName("Non-consecutive seats: Correct ordering with gaps")
	fun testNonConsecutiveSeats() {
		val players = mapOf(
			1 to createAiPlayer(1),
			4 to createAiPlayer(4),
			7 to createAiPlayer(7)
		)
		val buttonSeat = 1

		val order = manager.buildActionOrder(players, buttonSeat)

		// From button at 1, next is 4 (SB), then 7 (BB), then 1 (BTN)
		assertEquals(3, order.size)
		assertEquals(4, order[0].seatIndex, "SB should be seat 4")
		assertEquals(7, order[1].seatIndex, "BB should be seat 7")
		assertEquals(1, order[2].seatIndex, "BTN should be seat 1")
	}

	@Test
	@DisplayName("After player elimination: Correct reordering")
	fun testReorderingAfterElimination() {
		// Initially 4 players
		val initialPlayers = mapOf(
			0 to createAiPlayer(0),
			2 to createAiPlayer(2),
			4 to createAiPlayer(4),
			6 to createAiPlayer(6)
		)
		val buttonSeat = 0

		// Player at seat 2 eliminated
		val afterElimination = mapOf(
			0 to createAiPlayer(0),
			4 to createAiPlayer(4),
			6 to createAiPlayer(6)
		)

		val order = manager.buildActionOrder(afterElimination, buttonSeat)

		// From button at 0, next occupied is 4 (SB), then 6 (BB), then 0 (BTN)
		assertEquals(3, order.size)
		assertEquals(4, order[0].seatIndex)
		assertEquals(6, order[1].seatIndex)
		assertEquals(0, order[2].seatIndex)
	}

	@Test
	@DisplayName("Edge case: Button at seat 0 with players at 5, 7, 9")
	fun testButtonAtZeroNonSequential() {
		val players = mapOf(
			0 to createAiPlayer(0),
			5 to createAiPlayer(5),
			7 to createAiPlayer(7),
			9 to createAiPlayer(9)
		)
		val buttonSeat = 0

		val order = manager.buildActionOrder(players, buttonSeat)

		// From 0, next is 5 (SB), then 7 (BB), then 9, then 0 (BTN)
		assertEquals(4, order.size)
		assertEquals(5, order[0].seatIndex)
		assertEquals(7, order[1].seatIndex)
		assertEquals(9, order[2].seatIndex)
		assertEquals(0, order[3].seatIndex)
	}

	// =========================================================================
	// 4.2 First To Act (4 tests)
	// =========================================================================

	@Test
	@DisplayName("Preflop full ring: UTG acts first")
	fun testPreflopFullRingFirst() {
		val players = listOf(
			createAiPlayer(3), // SB
			createAiPlayer(4), // BB
			createAiPlayer(5), // UTG
			createAiPlayer(0),
			createAiPlayer(1),
			createAiPlayer(2)  // BTN
		)

		val firstIndex = manager.findFirstToAct(players, isPreflop = true)

		assertEquals(2, firstIndex, "UTG (index 2) should act first preflop")
	}

	@Test
	@DisplayName("Preflop heads-up: Button acts first")
	fun testPreflopHeadsUpFirst() {
		val players = listOf(
			createAiPlayer(0), // BTN/SB
			createAiPlayer(1)  // BB
		)

		val firstIndex = manager.findFirstToAct(players, isPreflop = true)

		assertEquals(0, firstIndex, "Button should act first in heads-up preflop")
	}

	@Test
	@DisplayName("Post-flop: First active player from SB position")
	fun testPostFlopFirstToAct() {
		val players = listOf(
			createAiPlayer(3), // SB
			createAiPlayer(4), // BB
			createAiPlayer(5), // UTG
			createAiPlayer(0)
		)

		val firstIndex = manager.findFirstToAct(players, isPreflop = false)

		assertEquals(0, firstIndex, "SB (index 0) should act first post-flop")
	}

	@Test
	@DisplayName("All folded except BB preflop: BB gets option")
	fun testOnlyBBActivePreflop() {
		val sb = createAiPlayer(0)
		sb.isFolded = true
		val bb = createAiPlayer(1)
		val utg = createAiPlayer(2)
		utg.isFolded = true

		val players = listOf(sb, bb, utg)

		val firstIndex = manager.findFirstToAct(players, isPreflop = true)

		// With only BB able to act, should return BB's index
		assertEquals(1, firstIndex, "BB should act when others folded")
	}

	// =========================================================================
	// 4.3 Available Actions (6 tests)
	// =========================================================================

	@Test
	@DisplayName("No bet facing: CHECK_BET_FOLD")
	fun testNoBetFacing() {
		val player = createAiPlayer(0)
		player.position = "UTG"
		player.lastAction = null

		val actionOrder = listOf(player)
		val availableActions = mutableMapOf<Int, AvailableActions>()

		manager.updateAvailableActions(
			actionOrder, availableActions, "flop", 0.0
		)

		assertEquals(AvailableActions.CHECK_BET_FOLD, 
			availableActions[0],
			"Should be CHECK_BET_FOLD when no bet")
	}

	@Test
	@DisplayName("Facing bet: CALL_RAISE_FOLD")
	fun testFacingBet() {
		val player = createAiPlayer(0)
		player.position = "UTG"
		player.currentBet = 0.0

		val actionOrder = listOf(player)
		val availableActions = mutableMapOf<Int, AvailableActions>()

		manager.updateAvailableActions(
			actionOrder, availableActions, "flop", 10.0
		)

		assertEquals(AvailableActions.CALL_RAISE_FOLD,
			availableActions[0],
			"Should be CALL_RAISE_FOLD when facing bet")
	}

	@Test
	@DisplayName("BB preflop no raise: CHECK_RAISE_FOLD (special case)")
	fun testBBPreflopSpecialCase() {
		val player = createAiPlayer(1)
		player.position = "BB"
		player.lastAction = "BB"
		player.currentBet = 1.0

		val actionOrder = listOf(player)
		val availableActions = mutableMapOf<Int, AvailableActions>()

		manager.updateAvailableActions(
			actionOrder, availableActions, "preflop", 1.0
		)

		assertEquals(AvailableActions.CHECK_RAISE_FOLD,
			availableActions[1],
			"BB should have CHECK_RAISE_FOLD option preflop")
	}

	@Test
	@DisplayName("Folded player: NONE")
	fun testFoldedPlayerActions() {
		val player = createAiPlayer(0)
		player.isFolded = true

		val actionOrder = listOf(player)
		val availableActions = mutableMapOf<Int, AvailableActions>()

		manager.updateAvailableActions(
			actionOrder, availableActions, "flop", 0.0
		)

		assertEquals(AvailableActions.NONE, availableActions[0],
			"Folded player should have no actions")
	}

	@Test
	@DisplayName("All-in player: NONE")
	fun testAllInPlayerActions() {
		val player = createAiPlayer(0)
		player.isAllIn = true

		val actionOrder = listOf(player)
		val availableActions = mutableMapOf<Int, AvailableActions>()

		manager.updateAvailableActions(
			actionOrder, availableActions, "flop", 0.0
		)

		assertEquals(AvailableActions.NONE, availableActions[0],
			"All-in player should have no actions")
	}

	@Test
	@DisplayName("Zero stack player: NONE")
	fun testZeroStackPlayerActions() {
		val player = createAiPlayer(0)
		player.stack = 0.0

		val actionOrder = listOf(player)
		val availableActions = mutableMapOf<Int, AvailableActions>()

		manager.updateAvailableActions(
			actionOrder, availableActions, "flop", 0.0
		)

		assertEquals(AvailableActions.NONE, availableActions[0],
			"Zero stack player should have no actions")
	}

	// =========================================================================
	// 4.4 Finding Next Seat (3 tests)
	// =========================================================================

	@Test
	@DisplayName("Normal case: Find next occupied seat clockwise")
	fun testFindNextOccupiedSeat() {
		val players = mapOf(
			0 to createAiPlayer(0),
			3 to createAiPlayer(3),
			7 to createAiPlayer(7)
		)

		val nextFromZero = manager.findNextOccupiedSeat(players, 0)
		assertEquals(3, nextFromZero, "From 0, next should be 3")

		val nextFromThree = manager.findNextOccupiedSeat(players, 3)
		assertEquals(7, nextFromThree, "From 3, next should be 7")
	}

	@Test
	@DisplayName("Wrap around: From seat 8 to seat 1 (skipping empty 9, 0)")
	fun testWrapAroundSeats() {
		val players = mapOf(
			1 to createAiPlayer(1),
			4 to createAiPlayer(4),
			8 to createAiPlayer(8)
		)

		val nextFromEight = manager.findNextOccupiedSeat(players, 8)
		assertEquals(1, nextFromEight, "From 8, should wrap to 1")
	}

	@Test
	@DisplayName("No next seat: Only one player (returns null)")
	fun testNoNextSeat() {
		val players = mapOf(
			5 to createAiPlayer(5)
		)

		val next = manager.findNextOccupiedSeat(players, 5)
		assertNull(next, "Should return null with only one player")
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

	private fun createHumanPlayer(seatIndex: Int): PokerPlayer {
		return HumanPlayer(
			seatIndex = seatIndex,
			position = "",
			stack = 100.0
		)
	}
}

