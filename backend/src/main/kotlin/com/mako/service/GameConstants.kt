package com.mako.service

import com.mako.model.Card
import com.mako.enums.Rank
import com.mako.enums.Suit

/**
 * Centralized constants for poker game logic.
 * 
 * This file contains all magic numbers, strings, and configuration values
 * used throughout the game service layer. Grouping constants here ensures:
 * - Single source of truth for game configuration
 * - Easy modification without hunting through code
 * - Clear documentation of each value's purpose
 */
object GameConstants {

	// =========================================================================
	// SEAT CONFIGURATION
	// =========================================================================

	/**
	 * Maximum seat index (0-indexed).
	 * With 10 total seats, indices range from 0 to 9.
	 */
	const val MAX_SEAT_INDEX = 9

	/**
	 * Minimum seat index.
	 * Seat numbering starts at 0.
	 */
	const val MIN_SEAT_INDEX = 0

	/**
	 * Hero (human player) always occupies seat 0.
	 * This is the bottom-center position in the UI.
	 */
	const val HERO_SEAT_INDEX = 0

	// =========================================================================
	// PLAYER LIMITS
	// =========================================================================

	/**
	 * Minimum players required for a valid poker game.
	 * Heads-up (2 players) is the minimum playable format.
	 */
	const val MIN_PLAYERS = 2

	/**
	 * Maximum players at the table.
	 * Standard 10-max table configuration.
	 */
	const val MAX_PLAYERS = 10

	/**
	 * Default stack size when creating new players.
	 * Measured in big blinds or absolute currency units.
	 */
	const val DEFAULT_STARTING_STACK = 100.0

	// =========================================================================
	// STREET NAMES
	// These represent the betting rounds in Texas Hold'em.
	// =========================================================================

	/**
	 * Preflop - initial betting round before any community cards.
	 * Players have only their hole cards.
	 */
	const val STREET_PREFLOP = "preflop"

	/**
	 * Flop - second betting round after 3 community cards are dealt.
	 */
	const val STREET_FLOP = "flop"

	/**
	 * Turn - third betting round after 4th community card is dealt.
	 */
	const val STREET_TURN = "turn"

	/**
	 * River - final betting round after 5th community card is dealt.
	 */
	const val STREET_RIVER = "river"

	/**
	 * Showdown - all betting complete, hands are revealed.
	 * Winner is determined by hand strength.
	 */
	const val STREET_SHOWDOWN = "showdown"

	// =========================================================================
	// PLAYER ACTIONS
	// Display strings for player action history.
	// =========================================================================

	/** Player surrendered their hand */
	const val ACTION_FOLD = "Fold"

	/** Player passed without betting (no bet to call) */
	const val ACTION_CHECK = "Check"

	/** Player matched the current bet */
	const val ACTION_CALL = "Call"

	/** Player bet all remaining chips */
	const val ACTION_ALL_IN = "All-in"

	/** Prefix for raise action display */
	const val ACTION_RAISE_PREFIX = "RAISE"

	/** Marker indicating player posted small blind */
	const val ACTION_SB = "SB"

	/** Marker indicating player posted big blind */
	const val ACTION_BB = "BB"

	// =========================================================================
	// ACTION INPUT STRINGS
	// These are the action types received from client requests.
	// =========================================================================

	const val INPUT_FOLD = "fold"
	const val INPUT_CHECK = "check"
	const val INPUT_CALL = "call"
	const val INPUT_RAISE = "raise"
	const val INPUT_BET = "bet"
	const val INPUT_ALLIN = "allin"

	// =========================================================================
	// CARD DEFINITIONS
	// =========================================================================

	/**
	 * All card ranks from lowest to highest.
	 */
	val ALL_RANKS: List<Rank> = Rank.entries

	/**
	 * All card suits.
	 */
	val ALL_SUITS: List<Suit> = Suit.entries

	/** Total cards in a standard deck */
	const val DECK_SIZE = 52

	/** Number of community cards at showdown */
	const val COMMUNITY_CARDS_TOTAL = 5

	/**
	 * Creates a standard 52-card deck.
	 * Cards are not shuffled - caller should shuffle after creation.
	 */
	fun createStandardDeck(): MutableList<Card> {
		val deck = mutableListOf<Card>()
		for (suit in ALL_SUITS) {
			for (rank in ALL_RANKS) {
				deck.add(Card(rank, suit))
			}
		}
		return deck
	}

	// =========================================================================
	// POSITION NAMES AND MAPPINGS
	// =========================================================================

	/** Button position - last to act post-flop, best position */
	const val POSITION_BTN = "BTN"

	/** Small blind - first forced bet, first to act post-flop */
	const val POSITION_SB = "SB"

	/** Big blind - second forced bet, acts last preflop */
	const val POSITION_BB = "BB"

	/** Under the gun - first to act preflop in full ring */
	const val POSITION_UTG = "UTG"

	/** Cutoff - one seat before button */
	const val POSITION_CO = "CO"

	/** Middle position */
	const val POSITION_MP = "MP"

	/**
	 * Maps player count to ordered position names.
	 * Positions are listed in clockwise order starting from button.
	 * 
	 * Used to assign position labels to players based on their
	 * distance from the dealer button.
	 */
	val POSITIONS_BY_COUNT = mapOf(
		2 to listOf(POSITION_BTN, POSITION_BB),
		3 to listOf(POSITION_BTN, POSITION_SB, POSITION_BB),
		4 to listOf(POSITION_BTN, POSITION_SB, POSITION_BB, POSITION_UTG),
		5 to listOf(
			POSITION_BTN, POSITION_SB, POSITION_BB, 
			POSITION_UTG, POSITION_CO
		),
		6 to listOf(
			POSITION_BTN, POSITION_SB, POSITION_BB, 
			POSITION_UTG, POSITION_MP, POSITION_CO
		),
		7 to listOf(
			POSITION_BTN, POSITION_SB, POSITION_BB, 
			POSITION_UTG, "UTG+1", POSITION_MP, POSITION_CO
		),
		8 to listOf(
			POSITION_BTN, POSITION_SB, POSITION_BB, 
			POSITION_UTG, "UTG+1", POSITION_MP, "MP+1", POSITION_CO
		),
		9 to listOf(
			POSITION_BTN, POSITION_SB, POSITION_BB, 
			POSITION_UTG, "UTG+1", "UTG+2", POSITION_MP, "MP+1", POSITION_CO
		),
		10 to listOf(
			POSITION_BTN, POSITION_SB, POSITION_BB, 
			POSITION_UTG, "UTG+1", "UTG+2", POSITION_MP, "MP+1", "MP+2", 
			POSITION_CO
		)
	)

	// =========================================================================
	// AI CONFIGURATION
	// =========================================================================

	/** Probability AI will raise when facing no bet */
	const val AI_RAISE_PROBABILITY = 0.2

	/** Probability AI will call when facing all-in */
	const val AI_ALLIN_CALL_PROBABILITY = 0.6

	/** Probability AI will fold when facing a bet */
	const val AI_FOLD_PROBABILITY = 0.15

	/** Probability AI will call (cumulative with fold) */
	const val AI_CALL_PROBABILITY = 0.85

	// =========================================================================
	// GAME STATE DEFAULTS
	// =========================================================================

	/** Initial current player index when no hand is in progress */
	const val NO_CURRENT_PLAYER = -1

	/** Initial pot value */
	const val INITIAL_POT = 0.0
}

