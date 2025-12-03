package com.mako.service

import com.mako.enums.AvailableActions
import com.mako.model.PokerPlayer
import com.mako.service.GameConstants.ACTION_BB
import com.mako.service.GameConstants.ACTION_SB
import com.mako.service.GameConstants.MAX_SEAT_INDEX
import com.mako.service.GameConstants.POSITION_BB
import com.mako.service.GameConstants.STREET_PREFLOP
import org.springframework.stereotype.Service

/**
 * Manages player action order and available actions.
 * 
 * Responsibilities:
 * - Reordering players by action sequence each hand
 * - Tracking and updating available actions
 * - Determining next player to act
 */
@Service
class ActionOrderManager {

	/**
	 * Reorders players for a new hand based on dealer button position.
	 * 
	 * Action order is clockwise from the button:
	 * - Full ring: SB (0), BB (1), UTG (2), ..., BTN (last)
	 * - Heads-up: SB/BTN (0), BB (1) - button posts SB and acts first preflop
	 * 
	 * @param playersBySeat All players mapped by their seat index
	 * @param dealerSeatIndex Current button position (physical seat 0-9)
	 * @return List of players ordered by action sequence
	 */
	fun buildActionOrder(
		playersBySeat: Map<Int, PokerPlayer>,
		dealerSeatIndex: Int
	): MutableList<PokerPlayer> {
		val occupiedSeats = playersBySeat.keys.sorted()

		if (occupiedSeats.size == 2) {
			return buildHeadsUpOrder(playersBySeat, dealerSeatIndex)
		}

		return buildFullRingOrder(playersBySeat, dealerSeatIndex)
	}

	/**
	 * Builds action order for heads-up play.
	 * In heads-up: BTN posts SB and acts first preflop,
	 * BB acts last preflop but first post-flop.
	 */
	private fun buildHeadsUpOrder(
		playersBySeat: Map<Int, PokerPlayer>,
		dealerSeatIndex: Int
	): MutableList<PokerPlayer> {
		val players = playersBySeat.values.toList()
		val btnPlayer = players.find { it.seatIndex == dealerSeatIndex }
			?: players.first()
		val bbPlayer = players.find { it != btnPlayer }
			?: throw IllegalStateException("Heads-up requires 2 players")

		return mutableListOf(btnPlayer, bbPlayer)
	}

	/**
	 * Builds action order for 3+ players.
	 * Order starts from SB (first seat clockwise from button).
	 */
	private fun buildFullRingOrder(
		playersBySeat: Map<Int, PokerPlayer>,
		dealerSeatIndex: Int
	): MutableList<PokerPlayer> {
		val sbSeatIndex = findNextOccupiedSeat(playersBySeat, dealerSeatIndex)
			?: throw IllegalStateException("No SB seat found")

		val ordered = mutableListOf<PokerPlayer>()
		var currentSeat = sbSeatIndex
		var count = 0
		val playerCount = playersBySeat.size

		while (count < playerCount) {
			playersBySeat[currentSeat]?.let { ordered.add(it) }
			currentSeat = findNextOccupiedSeat(playersBySeat, currentSeat)
				?: break
			count++
		}

		return ordered
	}

	/**
	 * Updates available actions for all players based on current game state.
	 * 
	 * @param actionOrder Players in action order
	 * @param availableActions Map to update with calculated actions
	 * @param street Current betting round
	 * @param lastBet Current bet to match
	 */
	fun updateAvailableActions(
		actionOrder: List<PokerPlayer>,
		availableActions: MutableMap<Int, AvailableActions>,
		street: String,
		lastBet: Double
	) {
		for (player in actionOrder) {
			availableActions[player.seatIndex] = calculateAvailableActions(
				player, street, lastBet
			)
		}
	}

	/**
	 * Calculates what actions a specific player can take.
	 */
	private fun calculateAvailableActions(
		player: PokerPlayer,
		street: String,
		lastBet: Double
	): AvailableActions {
		if (player.isFolded || player.isAllIn) {
			return AvailableActions.NONE
		}

		if (player.stack <= 0) {
			return AvailableActions.NONE
		}

		val toCall = lastBet - player.currentBet

		if (toCall <= 0) {
			// Special case: BB preflop with no raise gets option to check/raise
			if (street == STREET_PREFLOP &&
				player.position == POSITION_BB &&
				player.lastAction == ACTION_BB
			) {
				return AvailableActions.CHECK_RAISE_FOLD
			}
			return AvailableActions.CHECK_BET_FOLD
		}

		return AvailableActions.CALL_RAISE_FOLD
	}

	/**
	 * Finds the next player who needs to act.
	 * 
	 * @param actionOrder Players in action order
	 * @param availableActions Current available actions map
	 * @param fromIndex Index to start searching from (exclusive)
	 * @param lastBet Current bet amount
	 * @param lastAggressorIndex Index of last player who bet/raised
	 * @return Index of next actor, or -1 if betting round is complete
	 */
	fun findNextActor(
		actionOrder: List<PokerPlayer>,
		availableActions: Map<Int, AvailableActions>,
		fromIndex: Int,
		lastBet: Double,
		lastAggressorIndex: Int
	): Int {
		val playerCount = actionOrder.size
		var checked = 0
		var index = (fromIndex + 1) % playerCount

		while (checked < playerCount) {
			val player = actionOrder[index]
			val actions = availableActions[player.seatIndex]

			if (actions != null && actions != AvailableActions.NONE) {
				if (needsToAct(player, index, lastBet, lastAggressorIndex)) {
					return index
				}
			}

			index = (index + 1) % playerCount
			checked++
		}

		return -1 // Betting round complete
	}

	/**
	 * Determines if a player needs to act this betting round.
	 * 
	 * A player needs to act if:
	 * - They haven't acted yet this round (action is null, SB, or BB)
	 * - OR someone raised after their last action and they need to respond
	 */
	private fun needsToAct(
		player: PokerPlayer,
		playerIndex: Int,
		lastBet: Double,
		lastAggressorIndex: Int
	): Boolean {
		// Never acted this round - blinds count as initial posting, not action
		if (player.lastAction in listOf(null, ACTION_SB, ACTION_BB)) {
			return true
		}

		// Someone raised after this player's action - needs to respond
		if (lastAggressorIndex != -1 && lastAggressorIndex != playerIndex) {
			val toCall = lastBet - player.currentBet
			if (toCall > 0) {
				return true
			}
		}

		return false
	}

	/**
	 * Finds first player to act for a betting round.
	 * 
	 * Preflop: UTG (index 2) or BTN for heads-up
	 * Post-flop: SB (index 0) or first active player clockwise
	 * 
	 * @param actionOrder Players in action order
	 * @param isPreflop Whether this is the preflop round
	 * @return Index of first actor, or -1 if no active players
	 */
	fun findFirstToAct(
		actionOrder: List<PokerPlayer>,
		isPreflop: Boolean
	): Int {
		if (isPreflop) {
			if (actionOrder.size == 2) {
				// Heads-up: BTN/SB acts first preflop (index 0)
				return if (actionOrder[0].canAct()) 0 else -1
			}
			// Full ring: UTG is first (index 2, after SB and BB)
			for (i in 2 until actionOrder.size) {
				if (actionOrder[i].canAct()) return i
			}
			// Fall back to SB/BB if everyone else folded
			for (i in 0..1) {
				if (actionOrder[i].canAct()) return i
			}
			return -1
		}

		// Post-flop: First active player from SB
		for (i in actionOrder.indices) {
			if (actionOrder[i].canAct()) {
				return i
			}
		}

		return -1
	}

	/**
	 * Finds next occupied seat clockwise from a given seat.
	 * 
	 * @param playersBySeat Map of players by their seat index
	 * @param fromSeat Seat to start searching from (exclusive)
	 * @return Next occupied seat index, or null if none found
	 */
	fun findNextOccupiedSeat(
		playersBySeat: Map<Int, PokerPlayer>,
		fromSeat: Int
	): Int? {
		var seat = (fromSeat + 1) % (MAX_SEAT_INDEX + 1)
		var checked = 0

		while (checked < MAX_SEAT_INDEX + 1) {
			if (playersBySeat.containsKey(seat) && seat != fromSeat) {
				return seat
			}
			seat = (seat + 1) % (MAX_SEAT_INDEX + 1)
			checked++
		}

		return null
	}
}

