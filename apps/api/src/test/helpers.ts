import {GameState, Player, Card, createCard} from '@mako/shared'
import { STREET_PREFLOP } from '@mako/shared'
import type { InternalGameState } from '../domain/game-state'

// Re-export createCard for test files
export { createCard }

/**
 * Creates a test game state.
 */
export function createTestGame(overrides: Partial<GameState> = {}): GameState {
	return {
		id: 'test-game-id',
		playerCount: 2,
		players: [
			createTestPlayer({ seatIndex: 0, isHero: true }),
			createTestPlayer({ seatIndex: 1, isHero: false })
		],
		heroSeatIndex: 0,
		dealerSeatIndex: 0,
		currentPlayerIndex: 0,
		pot: 0,
		street: STREET_PREFLOP,
		communityCards: [],
		isHandInProgress: false,
		blinds: { small: 0.5, big: 1 },
		minRaise: 1,
		maxRaise: 100,
		toCall: 0,
		winner: null,
		winningHand: null,
		...overrides
	}
}

/**
 * Creates a test internal game state with deck.
 */
export function createTestInternalGame(
	overrides: Partial<InternalGameState> = {}
): InternalGameState {
	return {
		...createTestGame(overrides),
		deck: createTestDeck(),
		playerContributions: {},
		lastBet: 0,
		...overrides
	} as InternalGameState
}

/**
 * Creates a test player.
 */
export function createTestPlayer(
	overrides: Partial<Player> = {}
): Player {
	return {
		seatIndex: 0,
		position: 'BTN',
		stack: 100,
		holeCards: null,
		lastAction: null,
		isFolded: false,
		isAllIn: false,
		currentBet: 0,
		isHero: false,
		...overrides
	}
}

/**
 * Creates a minimal test deck.
 */
export function createTestDeck(): Card[] {
	return [
		createCard('A', 'spades'),
		createCard('K', 'spades'),
		createCard('Q', 'spades'),
		createCard('J', 'spades'),
		createCard('T', 'spades'),
		createCard('9', 'spades'),
		createCard('8', 'spades'),
		createCard('7', 'spades'),
		createCard('6', 'spades'),
		createCard('5', 'spades'),
		createCard('4', 'spades'),
		createCard('3', 'spades'),
		createCard('2', 'spades'),
		createCard('A', 'hearts'),
        createCard('K', 'hearts'),
		createCard('Q', 'hearts')
	]
}
