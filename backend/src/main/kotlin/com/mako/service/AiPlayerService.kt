package com.mako.service

import com.mako.dto.PlayerActionRequest
import com.mako.service.GameConstants.AI_ALLIN_CALL_PROBABILITY
import com.mako.service.GameConstants.AI_CALL_PROBABILITY
import com.mako.service.GameConstants.AI_FOLD_PROBABILITY
import com.mako.service.GameConstants.AI_RAISE_PROBABILITY
import com.mako.service.GameConstants.INPUT_ALLIN
import com.mako.service.GameConstants.INPUT_CALL
import com.mako.service.GameConstants.INPUT_CHECK
import com.mako.service.GameConstants.INPUT_FOLD
import com.mako.service.GameConstants.INPUT_RAISE
import org.springframework.stereotype.Service
import kotlin.random.Random

/**
 * Service for AI player decision-making.
 * 
 * Currently implements a simple probabilistic strategy.
 * Future enhancements could include:
 * - GTO solver integration
 * - Machine learning based decisions
 * - Opponent modeling
 * - Position-aware strategy
 */
@Service
class AiPlayerService {

	/**
	 * Context containing all information an AI needs to make a decision.
	 * Passes only data, not behavior - following "pass data not objects" principle.
	 */
	data class ActionContext(
		/** Amount player must add to call the current bet */
		val toCall: Double,
		
		/** Player's remaining chip stack */
		val playerStack: Double,
		
		/** Current bet to match */
		val lastBet: Double,
		
		/** Minimum raise size (increment above lastBet) */
		val minRaise: Double,
		
		/** Current pot size */
		val pot: Double,
		
		/** Current betting round (preflop, flop, turn, river) */
		val street: String,
		
		/** Player's table position (BTN, SB, BB, UTG, etc.) */
		val position: String
	)

	/**
	 * Determines the AI player's action based on game context.
	 * 
	 * Current strategy (simple probabilistic):
	 * - When facing no bet: 80% check, 20% raise
	 * - When facing all-in: 60% call, 40% fold
	 * - Standard bet: 15% fold, 70% call, 15% raise
	 * 
	 * @param context Relevant game state for decision making
	 * @return The action the AI chooses to take
	 */
	fun determineAction(context: ActionContext): PlayerActionRequest {
		val random = Random.nextDouble()

		// No bet to call - check or raise
		if (context.toCall == 0.0) {
			return decideNoBetFacing(context, random)
		}

		// Facing all-in decision
		if (context.toCall >= context.playerStack) {
			return decideAllInFacing(random)
		}

		// Standard betting decision
		return decideStandardBet(context, random)
	}

	/**
	 * Decision when no bet is facing the player.
	 * Can check freely or make a bet.
	 */
	private fun decideNoBetFacing(
		context: ActionContext, 
		random: Double
	): PlayerActionRequest {
		val minTotalBet = context.lastBet + context.minRaise
		return if (random < AI_RAISE_PROBABILITY && 
				   context.playerStack >= minTotalBet) {
			PlayerActionRequest(INPUT_RAISE, minTotalBet)
		} else {
			PlayerActionRequest(INPUT_CHECK)
		}
	}

	/**
	 * Decision when facing an all-in bet.
	 * Must call with entire stack or fold.
	 */
	private fun decideAllInFacing(random: Double): PlayerActionRequest {
		return if (random < AI_ALLIN_CALL_PROBABILITY) {
			PlayerActionRequest(INPUT_ALLIN)
		} else {
			PlayerActionRequest(INPUT_FOLD)
		}
	}

	/**
	 * Decision for standard betting situations.
	 * Can fold, call, or raise.
	 */
	private fun decideStandardBet(
		context: ActionContext, 
		random: Double
	): PlayerActionRequest {
		val minTotalBet = context.lastBet + context.minRaise
		
		return when {
			random < AI_FOLD_PROBABILITY -> {
				PlayerActionRequest(INPUT_FOLD)
			}
			random < AI_CALL_PROBABILITY -> {
				PlayerActionRequest(INPUT_CALL)
			}
			else -> {
				val raiseAmount = minOf(
					minTotalBet,
					context.playerStack + context.toCall
				)
				PlayerActionRequest(INPUT_RAISE, raiseAmount)
			}
		}
	}
}

