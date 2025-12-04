import type { GameState, Player, Card, Rank, Suit } from '@mako/shared'
import { STREET_PREFLOP } from '@mako/shared'
import type { InternalGameState } from '../domain/game-state'

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
 * Creates a test card.
 */
export function createTestCard(rank: Rank, suit: Suit): Card {
	return {
		rank,
		suit
	}
}

/**
 * Creates a minimal test deck.
 */
export function createTestDeck(): Card[] {
	return [
		createTestCard('A', 'spades'),
		createTestCard('K', 'spades'),
		createTestCard('Q', 'spades'),
		createTestCard('J', 'spades'),
		createTestCard('T', 'spades'),
		createTestCard('9', 'spades'),
		createTestCard('8', 'spades'),
		createTestCard('7', 'spades'),
		createTestCard('6', 'spades'),
		createTestCard('5', 'spades'),
		createTestCard('4', 'spades'),
		createTestCard('3', 'spades'),
		createTestCard('2', 'spades'),
		createTestCard('A', 'hearts'),
		createTestCard('K', 'hearts'),
		createTestCard('Q', 'hearts')
	]
}
