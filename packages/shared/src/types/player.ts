import type { Card } from './card'

/**
 * Player position names.
 */
export type Position =
	| 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'UTG+2'
	| 'MP' | 'MP+1' | 'HJ' | 'CO'

/**
 * Player action types.
 */
export type ActionType =
	| 'fold' | 'call' | 'check' | 'raise' | 'bet' | 'allin'

/**
 * Action constants.
 */
export const ACTION_FOLD = 'fold' as const
export const ACTION_CALL = 'call' as const
export const ACTION_CHECK = 'check' as const
export const ACTION_RAISE = 'raise' as const
export const ACTION_BET = 'bet' as const
export const ACTION_ALL_IN = 'allin' as const

/**
 * Represents a player at the table.
 */
export interface Player {
	seatIndex: number
	position: Position | string
	stack: number
	holeCards: Card[] | null
	lastAction: ActionType | string | null
	isFolded: boolean
	isAllIn: boolean
	currentBet: number
	isHero: boolean
}

/**
 * Base player interface for initialization.
 */
export interface BasePlayer {
	seatIndex: number
	stack: number
	isHero: boolean
}

