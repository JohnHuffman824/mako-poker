import type { Card } from './card'
import type { Player, ActionType } from './player'

/**
 * Possible street values.
 */
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

/**
 * Street constants.
 */
export const STREET_PREFLOP = 'preflop' as const
export const STREET_FLOP = 'flop' as const
export const STREET_TURN = 'turn' as const
export const STREET_RIVER = 'river' as const
export const STREET_SHOWDOWN = 'showdown' as const

/**
 * Represents blinds configuration.
 */
export interface Blinds {
	small: number
	big: number
}

/**
 * Represents a side pot for all-in scenarios.
 */
export interface SidePot {
	id: number
	amount: number
	eligiblePlayerSeats: number[]
	capPerPlayer: number
	isMainPot: boolean
	displayName: string
}

/**
 * Available action categories.
 */
export type AvailableActions =
	| 'CHECK_BET_FOLD'
	| 'CALL_RAISE_FOLD'
	| 'CALL_FOLD'
	| 'CHECK_FOLD'
	| 'ALL_IN_FOLD'

/**
 * Complete game state from the backend.
 */
export interface GameState {
	id: string
	playerCount: number
	players: Player[]
	heroSeatIndex: number
	dealerSeatIndex: number
	currentPlayerIndex: number
	pot: number
	street: Street
	communityCards: Card[]
	isHandInProgress: boolean
	blinds: Blinds
	minRaise: number
	maxRaise: number
	toCall: number
	winner: Player | null
	winningHand: string | null
	availableActions?: AvailableActions | null
	actionOrderSeats?: number[]
	isShowdown?: boolean
	sidePots?: SidePot[]
	playerContributions?: Record<number, number>
	lastBet?: number
}

/**
 * Request to start a new game.
 */
export interface StartGameRequest {
	playerCount: number
	startingStack?: number
	smallBlind?: number
	bigBlind?: number
}

/**
 * Request to submit a player action.
 */
export interface PlayerActionRequest {
	action: ActionType
	amount?: number
}

/**
 * Request to update blind sizes.
 */
export interface UpdateBlindsRequest {
	smallBlind: number
	bigBlind: number
}
