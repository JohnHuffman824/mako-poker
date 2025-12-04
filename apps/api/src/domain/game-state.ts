import type { GameState, Player, Card } from '@mako/shared'
import { STREET_PREFLOP, createShuffledDeck } from '@mako/shared'
import { createPlayer } from './player'
import { buildActionOrderSeats } from '../services/position-service'

/**
 * Game state defaults.
 */
export const GAME_DEFAULTS = {
	PLAYER_COUNT: 6,
	STARTING_STACK: 100,
	SMALL_BLIND: 0.5,
	BIG_BLIND: 1,
	HERO_SEAT_INDEX: 0
}

/**
 * Creates a new game state.
 */
export function createGameState(params: {
	id: string
	playerCount: number
	startingStack?: number
	smallBlind?: number
	bigBlind?: number
}): GameState {
	const playerCount = params.playerCount
	const startingStack = params.startingStack ?? GAME_DEFAULTS.STARTING_STACK
	const smallBlind = params.smallBlind ?? GAME_DEFAULTS.SMALL_BLIND
	const bigBlind = params.bigBlind ?? GAME_DEFAULTS.BIG_BLIND

	const players: Player[] = []

	// Create hero at seat 0
	players.push(createPlayer({
		seatIndex: 0,
		stack: startingStack,
		isHero: true
	}))

	// Create AI players at subsequent seats
	for (let i = 1; i < playerCount; i++) {
		players.push(createPlayer({
			seatIndex: i,
			stack: startingStack,
			isHero: false
		}))
	}

	return {
		id: params.id,
		playerCount,
		players,
		heroSeatIndex: 0,
		dealerSeatIndex: 0,
		currentPlayerIndex: -1,
		pot: 0,
		street: STREET_PREFLOP,
		communityCards: [],
		isHandInProgress: false,
		blinds: { small: smallBlind, big: bigBlind },
		minRaise: bigBlind,
		maxRaise: startingStack,
		toCall: 0,
		winner: null,
		winningHand: null,
		availableActions: null,
		actionOrderSeats: [],
		isShowdown: false,
		sidePots: [],
		playerContributions: {},
		lastBet: 0
	}
}

/**
 * Internal game state with deck (not exposed to clients).
 */
export interface InternalGameState extends GameState {
	deck: Card[]
}

/**
 * Creates internal game state with deck.
 */
export function createInternalGameState(params: {
	id: string
	playerCount: number
	startingStack?: number
	smallBlind?: number
	bigBlind?: number
}): InternalGameState {
	const gameState = createGameState(params)
	return {
		...gameState,
		deck: createShuffledDeck()
	}
}

/**
 * Converts internal state to client-safe DTO.
 * Computes toCall, maxRaise, and availableActions based on current player.
 */
export function toGameStateDto(
	internal: InternalGameState,
	isShowdown: boolean = false
): GameState {
	const players = internal.players.map(p => ({
		...p,
		// Only show AI cards at showdown
		holeCards: p.isHero || isShowdown ? p.holeCards : null
	}))

	// Get current player for dynamic calculations
	const currentPlayer = internal.currentPlayerIndex >= 0
		? internal.players[internal.currentPlayerIndex]
		: null

	// Calculate toCall for current player
	const toCall = currentPlayer
		? Math.max(0, (internal.lastBet ?? 0) - currentPlayer.currentBet)
		: 0

	// Calculate maxRaise (player's remaining stack + current bet)
	const maxRaise = currentPlayer
		? currentPlayer.stack + currentPlayer.currentBet
		: 0

	// Calculate minRaise as minimum TOTAL bet (lastBet + raise increment)
	// This is what the slider shows as the minimum value
	const minRaiseTotalBet = (internal.lastBet ?? 0) + internal.minRaise

	// Calculate available actions for current player
	const availableActions = calculateAvailableActions(internal, currentPlayer)

	// Build action order for frontend display
	const actionOrderSeats = buildActionOrderSeats(
		internal.players,
		internal.dealerSeatIndex
	)

	return {
		id: internal.id,
		playerCount: internal.playerCount,
		players,
		heroSeatIndex: internal.heroSeatIndex,
		dealerSeatIndex: internal.dealerSeatIndex,
		currentPlayerIndex: internal.currentPlayerIndex,
		pot: internal.pot,
		street: internal.street,
		communityCards: internal.communityCards,
		isHandInProgress: internal.isHandInProgress,
		blinds: internal.blinds,
		minRaise: minRaiseTotalBet,
		maxRaise,
		toCall,
		winner: internal.winner,
		winningHand: internal.winningHand,
		availableActions,
		actionOrderSeats,
		isShowdown,
		sidePots: internal.sidePots,
		playerContributions: internal.playerContributions,
		lastBet: internal.lastBet
	}
}

/**
 * Calculates available actions for a player.
 */
function calculateAvailableActions(
	game: InternalGameState,
	player: Player | null
): string | null {
	if (!player || !game.isHandInProgress) return null
	if (player.isFolded || player.isAllIn) return 'NONE'

	const toCall = (game.lastBet ?? 0) - player.currentBet

	if (toCall <= 0) {
		// BB preflop special case
		if (
			game.street === STREET_PREFLOP &&
			player.position === 'BB' &&
			player.lastAction === 'BB'
		) {
			return 'CHECK_RAISE_FOLD'
		}
		return 'CHECK_BET_FOLD'
	}

	return 'CALL_RAISE_FOLD'
}

/**
 * Gets active players (not folded).
 */
export function getActivePlayers(game: GameState): Player[] {
	return game.players.filter(p => !p.isFolded)
}

/**
 * Gets players who can still act (not folded, not all-in).
 */
export function getActingPlayers(game: GameState): Player[] {
	return game.players.filter(p => !p.isFolded && !p.isAllIn && p.stack > 0)
}

/**
 * Gets current player to act.
 */
export function getCurrentPlayer(game: GameState): Player | null {
	if (game.currentPlayerIndex < 0) return null
	return game.players[game.currentPlayerIndex] ?? null
}

