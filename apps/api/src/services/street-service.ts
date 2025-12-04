import type { InternalGameState } from '../domain/game-state'
import { STREET_FLOP, STREET_TURN, STREET_RIVER } from '@mako/shared'
import { getFirstToActPostFlop } from './position-service'

/**
 * Deals the flop (3 cards).
 */
export function dealFlop(game: InternalGameState): void {
	// Burn card
	game.deck.shift()

	// Deal 3 cards
	for (let i = 0; i < 3; i++) {
		const card = game.deck.shift()
		if (card) {
			game.communityCards.push(card)
		}
	}

	game.street = STREET_FLOP
	startNewBettingRound(game)
}

/**
 * Deals the turn (1 card).
 */
export function dealTurn(game: InternalGameState): void {
	// Burn card
	game.deck.shift()

	// Deal 1 card
	const card = game.deck.shift()
	if (card) {
		game.communityCards.push(card)
	}

	game.street = STREET_TURN
	startNewBettingRound(game)
}

/**
 * Deals the river (1 card).
 */
export function dealRiver(game: InternalGameState): void {
	// Burn card
	game.deck.shift()

	// Deal 1 card
	const card = game.deck.shift()
	if (card) {
		game.communityCards.push(card)
	}

	game.street = STREET_RIVER
	startNewBettingRound(game)
}

/**
 * Starts a new betting round (reset bets, find first to act).
 */
function startNewBettingRound(game: InternalGameState): void {
	// Reset betting state
	game.lastBet = 0
	game.minRaise = game.blinds.big

	// Clear player bets and actions
	for (const player of game.players) {
		player.currentBet = 0
		player.lastAction = null
	}

	// Post-flop: first to act is SB or first active after button
	game.currentPlayerIndex = getFirstToActPostFlop(
		game.players,
		game.dealerSeatIndex,
		game.playerCount
	)
}

/**
 * Deals remaining cards when all players are all-in.
 */
export function dealRemainingCards(game: InternalGameState): void {
	while (game.communityCards.length < 5) {
		// Burn card
		game.deck.shift()

		// Deal card
		const card = game.deck.shift()
		if (card) {
			game.communityCards.push(card)
		}
	}
}

