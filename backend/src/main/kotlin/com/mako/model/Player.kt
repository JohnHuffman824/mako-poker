package com.mako.model

import com.mako.dto.PlayerDto

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

/**
 * Base interface for all poker players.
 * Both AI and human players implement this interface.
 * 
 * This allows polymorphic handling of players while still
 * differentiating between AI and human-controlled players.
 */
interface PokerPlayer {
	/** Physical seat at the table (0-9) */
	val seatIndex: Int

	/** Position name (BTN, SB, BB, UTG, etc.) */
	var position: String

	/** Current chip stack */
	var stack: Double

	/** Bet placed in current betting round */
	var currentBet: Double

	/** Player's hole cards */
	val holeCards: MutableList<Card>

	/** Whether player has folded this hand */
	var isFolded: Boolean

	/** Whether player is all-in */
	var isAllIn: Boolean

	/** Last action display string */
	var lastAction: String?

	/** Whether this is the hero (human player) */
	val isHero: Boolean

	/** Whether this player can currently take an action */
	fun canAct(): Boolean = !isFolded && !isAllIn && stack > 0

	/** Reset state for new hand */
	fun reset()

	/** Convert to DTO for API response */
	fun toDto(showCards: Boolean): PlayerDto
}

/**
 * Human player controlled by user input.
 * Cards are always shown to the human player.
 */
data class HumanPlayer(
	override val seatIndex: Int,
	override var position: String = "",
	override var stack: Double,
	override var currentBet: Double = 0.0,
	override val holeCards: MutableList<Card> = mutableListOf(),
	override var isFolded: Boolean = false,
	override var isAllIn: Boolean = false,
	override var lastAction: String? = null
) : PokerPlayer {

	override val isHero: Boolean = true

	override fun reset() {
		holeCards.clear()
		currentBet = 0.0
		isFolded = false
		isAllIn = false
		lastAction = null
	}

	override fun toDto(showCards: Boolean): PlayerDto {
		return PlayerDto(
			seatIndex = seatIndex,
			position = position,
			stack = stack,
			holeCards = holeCards.map { it.toDto() },
			lastAction = lastAction,
			isFolded = isFolded,
			isAllIn = isAllIn,
			currentBet = currentBet,
			isHero = true
		)
	}
}

/**
 * AI player with automated decision making.
 * Cards are hidden until showdown.
 */
data class AiPlayer(
	override val seatIndex: Int,
	override var position: String = "",
	override var stack: Double,
	override var currentBet: Double = 0.0,
	override val holeCards: MutableList<Card> = mutableListOf(),
	override var isFolded: Boolean = false,
	override var isAllIn: Boolean = false,
	override var lastAction: String? = null
) : PokerPlayer {

	override val isHero: Boolean = false

	override fun reset() {
		holeCards.clear()
		currentBet = 0.0
		isFolded = false
		isAllIn = false
		lastAction = null
	}

	override fun toDto(showCards: Boolean): PlayerDto {
		return PlayerDto(
			seatIndex = seatIndex,
			position = position,
			stack = stack,
			holeCards = if (showCards) holeCards.map { it.toDto() } else null,
			lastAction = lastAction,
			isFolded = isFolded,
			isAllIn = isAllIn,
			currentBet = currentBet,
			isHero = false
		)
	}
}

