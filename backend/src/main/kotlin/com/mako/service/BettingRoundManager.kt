package com.mako.service

import com.mako.dto.BlindsDto
import com.mako.enums.AvailableActions
import com.mako.model.PokerPlayer
import com.mako.service.GameConstants.ACTION_ALL_IN
import com.mako.service.GameConstants.ACTION_BB
import com.mako.service.GameConstants.ACTION_CALL
import com.mako.service.GameConstants.ACTION_CHECK
import com.mako.service.GameConstants.ACTION_FOLD
import com.mako.service.GameConstants.ACTION_SB
import com.mako.service.GameConstants.INPUT_ALLIN
import com.mako.service.GameConstants.INPUT_BET
import com.mako.service.GameConstants.INPUT_CALL
import com.mako.service.GameConstants.INPUT_CHECK
import com.mako.service.GameConstants.INPUT_FOLD
import com.mako.service.GameConstants.INPUT_RAISE
import org.springframework.stereotype.Service

/**
 * Result of processing a betting round action.
 */
data class ActionResult(
	/** Whether the betting round is complete */
	val roundComplete: Boolean,
	/** Updated pot amount */
	val pot: Double,
	/** Updated last bet amount */
	val lastBet: Double,
	/** Updated minimum raise amount */
	val minRaise: Double,
	/** Index of last aggressor (-1 if none) */
	val lastAggressorIndex: Int,
	/** Index of next player to act (-1 if round complete) */
	val nextActorIndex: Int,
	/** Amount this player contributed to the pot with this action */
	val contribution: Double = 0.0,
	/** Seat index of player who took action */
	val actorSeatIndex: Int = -1
)

/**
 * Manages betting round flow for all streets.
 * 
 * Provides unified logic for:
 * - Starting a new betting round
 * - Processing player actions
 * - Determining when betting is complete
 * 
 * This service is stateless - all state is passed in and returned.
 */
@Service
class BettingRoundManager(
	private val actionOrderManager: ActionOrderManager
) {

	/**
	 * Starts a new betting round.
	 * 
	 * For preflop: Posts blinds, sets action to UTG (or BTN heads-up)
	 * For post-flop: Resets bets, sets action to SB or first active
	 * 
	 * @param actionOrder Players in action order
	 * @param availableActions Map to update
	 * @param blinds Blind sizes
	 * @param isPreflop Whether this is the preflop round
	 * @return Tuple of (pot, lastBet, minRaise, lastAggressorIndex, firstActorIndex)
	 */
	fun startBettingRound(
		actionOrder: MutableList<PokerPlayer>,
		availableActions: MutableMap<Int, AvailableActions>,
		blinds: BlindsDto,
		isPreflop: Boolean
	): StartRoundResult {
		var pot = 0.0
		var lastBet = 0.0
		var minRaise = blinds.big
		var blindContributions = emptyMap<Int, Double>()

		// Reset player bets (except blinds for preflop)
		for (player in actionOrder) {
			if (!isPreflop) {
				player.currentBet = 0.0
				player.lastAction = null
			}
		}

		if (isPreflop) {
			val blindResult = postBlinds(actionOrder, blinds)
			pot = blindResult.pot
			lastBet = blindResult.lastBet
			minRaise = blindResult.minRaise
			blindContributions = mapOf(
				actionOrder[0].seatIndex to blindResult.sbContribution,
				actionOrder[1].seatIndex to blindResult.bbContribution
			)
		}

		// Update available actions for all players
		actionOrderManager.updateAvailableActions(
			actionOrder, availableActions,
			if (isPreflop) GameConstants.STREET_PREFLOP else "postflop",
			lastBet
		)

		// Find first player to act
		val firstActorIndex = actionOrderManager.findFirstToAct(
			actionOrder, isPreflop
		)

		return StartRoundResult(
			pot = pot,
			lastBet = lastBet,
			minRaise = minRaise,
			lastAggressorIndex = -1,
			firstActorIndex = firstActorIndex,
			blindContributions = blindContributions
		)
	}

	/**
	 * Posts small and big blinds.
	 * SB is at actionOrder[0], BB is at actionOrder[1].
	 */
	private fun postBlinds(
		actionOrder: List<PokerPlayer>,
		blinds: BlindsDto
	): BlindsResult {
		val sb = actionOrder[0]
		val bb = actionOrder[1]

		// Post small blind
		val sbAmount = minOf(blinds.small, sb.stack)
		sb.stack -= sbAmount
		sb.currentBet = sbAmount
		sb.lastAction = ACTION_SB

		// Post big blind
		val bbAmount = minOf(blinds.big, bb.stack)
		bb.stack -= bbAmount
		bb.currentBet = bbAmount
		bb.lastAction = ACTION_BB

		return BlindsResult(
			pot = sbAmount + bbAmount,
			lastBet = blinds.big,
			minRaise = blinds.big * 2,
			sbContribution = sbAmount,
			bbContribution = bbAmount
		)
	}

	/**
	 * Processes a player action and advances game state.
	 * 
	 * @param actionOrder Players in action order
	 * @param availableActions Current actions map
	 * @param currentActorIndex Index of player taking action
	 * @param action Action string (fold, check, call, raise, bet, allin)
	 * @param amount Bet/raise amount (nullable)
	 * @param currentPot Current pot size
	 * @param lastBet Current bet to match
	 * @param minRaise Current minimum raise
	 * @param lastAggressorIndex Index of last player who raised
	 * @param blinds Blind sizes for display calculations
	 * @param street Current street for action updates
	 * @return ActionResult with updated state
	 */
	fun processAction(
		actionOrder: MutableList<PokerPlayer>,
		availableActions: MutableMap<Int, AvailableActions>,
		currentActorIndex: Int,
		action: String,
		amount: Double?,
		currentPot: Double,
		lastBet: Double,
		minRaise: Double,
		lastAggressorIndex: Int,
		blinds: BlindsDto,
		street: String
	): ActionResult {
		val player = actionOrder[currentActorIndex]
		var newPot = currentPot
		var newLastBet = lastBet
		var newMinRaise = minRaise
		var newLastAggressorIndex = lastAggressorIndex
		var contribution = 0.0

		when (action.lowercase()) {
			INPUT_FOLD -> {
				handleFold(player)
			}
			INPUT_CHECK -> {
				handleCheck(player)
			}
			INPUT_CALL -> {
				val callResult = handleCall(player, lastBet, currentPot)
				newPot = callResult.pot
				contribution = callResult.contribution
			}
			INPUT_BET, INPUT_RAISE -> {
				val raiseResult = handleBetRaise(
					player, amount, lastBet, minRaise, currentPot, blinds.big
				)
				newPot = raiseResult.pot
				newLastBet = raiseResult.lastBet
				newMinRaise = raiseResult.minRaise
				contribution = raiseResult.contribution
				newLastAggressorIndex = currentActorIndex
			}
			INPUT_ALLIN -> {
				val allInResult = handleAllIn(
					player, lastBet, minRaise, currentPot, currentActorIndex
				)
				newPot = allInResult.pot
				newLastBet = allInResult.lastBet
				newMinRaise = allInResult.minRaise
				contribution = allInResult.contribution
				if (allInResult.isAggressor) {
					newLastAggressorIndex = currentActorIndex
				}
			}
		}

		// Update available actions
		actionOrderManager.updateAvailableActions(
			actionOrder, availableActions, street, newLastBet
		)

		// Find next actor
		val nextActor = actionOrderManager.findNextActor(
			actionOrder,
			availableActions,
			currentActorIndex,
			newLastBet,
			newLastAggressorIndex
		)

		return ActionResult(
			roundComplete = nextActor == -1,
			pot = newPot,
			lastBet = newLastBet,
			minRaise = newMinRaise,
			lastAggressorIndex = newLastAggressorIndex,
			nextActorIndex = nextActor,
			contribution = contribution,
			actorSeatIndex = player.seatIndex
		)
	}

	private fun handleFold(player: PokerPlayer) {
		player.isFolded = true
		player.lastAction = ACTION_FOLD
	}

	private fun handleCheck(player: PokerPlayer) {
		player.lastAction = ACTION_CHECK
	}

	private fun handleCall(
		player: PokerPlayer,
		lastBet: Double,
		currentPot: Double
	): CallResult {
		val toCall = lastBet - player.currentBet
		val actualCall = minOf(toCall, player.stack)

		player.stack -= actualCall
		player.currentBet += actualCall

		if (player.stack == 0.0) {
			player.isAllIn = true
			player.lastAction = ACTION_ALL_IN
		} else {
			player.lastAction = ACTION_CALL
		}

		return CallResult(
			pot = currentPot + actualCall,
			contribution = actualCall
		)
	}

	private fun handleBetRaise(
		player: PokerPlayer,
		amount: Double?,
		lastBet: Double,
		minRaise: Double,
		currentPot: Double,
		bigBlind: Double
	): RaiseResult {
		val raiseAmount = maxOf(amount ?: minRaise, minRaise)
		val totalBet = minOf(raiseAmount, player.stack + player.currentBet)
		val amountToAdd = totalBet - player.currentBet

		player.stack -= amountToAdd
		player.currentBet = totalBet

		// Calculate new min raise (size of this raise)
		val raiseSize = totalBet - lastBet
		val newMinRaise = raiseSize

		if (player.stack == 0.0) {
			player.isAllIn = true
			player.lastAction = ACTION_ALL_IN
		} else {
			val raiseBBs = (raiseSize / bigBlind).toInt()
			player.lastAction = "RAISE ${raiseBBs} BB"
		}

		return RaiseResult(
			pot = currentPot + amountToAdd,
			lastBet = totalBet,
			minRaise = newMinRaise,
			contribution = amountToAdd
		)
	}

	private fun handleAllIn(
		player: PokerPlayer,
		lastBet: Double,
		minRaise: Double,
		currentPot: Double,
		currentActorIndex: Int
	): AllInResult {
		val allInAmount = player.stack + player.currentBet
		val amountToAdd = player.stack

		var newLastBet = lastBet
		var newMinRaise = minRaise
		var isAggressor = false

		// Only update betting state if this is a raise
		if (allInAmount > lastBet) {
			val raiseSize = allInAmount - lastBet
			newMinRaise = allInAmount + raiseSize
			newLastBet = allInAmount
			isAggressor = true
		}

		player.currentBet = allInAmount
		player.stack = 0.0
		player.isAllIn = true
		player.lastAction = ACTION_ALL_IN

		return AllInResult(
			pot = currentPot + amountToAdd,
			lastBet = newLastBet,
			minRaise = newMinRaise,
			isAggressor = isAggressor,
			contribution = amountToAdd
		)
	}

	/**
	 * Checks if the betting round is complete.
	 * 
	 * Complete when all active players have matched the bet and had 
	 * a chance to act since the last raise.
	 */
	fun isBettingRoundComplete(
		actionOrder: List<PokerPlayer>,
		lastBet: Double
	): Boolean {
		val activePlayers = actionOrder.filter { it.canAct() }

		// All players folded or all-in
		if (activePlayers.isEmpty()) {
			return true
		}

		// Only one player left who can act - round is complete
		if (activePlayers.size == 1) {
			return true
		}

		// Check if all active players have matched the bet and acted
		for (player in activePlayers) {
			// Player hasn't acted (blinds don't count)
			if (player.lastAction in listOf(null, ACTION_SB, ACTION_BB)) {
				return false
			}

			// Player bet doesn't match
			val toCall = lastBet - player.currentBet
			if (toCall > 0) {
				return false
			}
		}

		return true
	}
}

/** Result of starting a betting round */
data class StartRoundResult(
	val pot: Double,
	val lastBet: Double,
	val minRaise: Double,
	val lastAggressorIndex: Int,
	val firstActorIndex: Int,
	/** Map of seat index to blind contribution */
	val blindContributions: Map<Int, Double> = emptyMap()
)

/** Internal result of posting blinds */
private data class BlindsResult(
	val pot: Double,
	val lastBet: Double,
	val minRaise: Double,
	val sbContribution: Double = 0.0,
	val bbContribution: Double = 0.0
)

/** Internal result of a call action */
private data class CallResult(
	val pot: Double,
	val contribution: Double
)

/** Internal result of a raise action */
private data class RaiseResult(
	val pot: Double,
	val lastBet: Double,
	val minRaise: Double,
	val contribution: Double
)

/** Internal result of an all-in action */
private data class AllInResult(
	val pot: Double,
	val lastBet: Double,
	val minRaise: Double,
	val isAggressor: Boolean,
	val contribution: Double
)

