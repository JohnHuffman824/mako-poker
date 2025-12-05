/**
 * Game configuration constants.
 */
export const GAME_DEFAULTS = {
	PLAYER_COUNT: 6,
	STARTING_STACK: 100,
	SMALL_BLIND: 0.5,
	BIG_BLIND: 1,
	MIN_PLAYERS: 2,
	MAX_PLAYERS: 10,
	MIN_BLIND: 1,
	MAX_BLIND: 100,
	BLIND_INCREMENT: 1,
	HERO_SEAT_INDEX: 0
} as const

/**
 * Timing constants for game flow.
 */
export const TIMING = {
	AI_ACTION_DELAY_MS: 500,
	AUTO_DEAL_DELAY_MS: 2000,
	MAX_AI_ITERATIONS: 20
} as const

/**
 * Position assignments for different table sizes.
 */
export const POSITION_NAMES: Record<number, string[]> = {
	2: ['BTN', 'BB'],
	3: ['BTN', 'SB', 'BB'],
	4: ['BTN', 'SB', 'BB', 'UTG'],
	5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
	6: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
	7: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'CO'],
	8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
	9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
	10: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'HJ', 'CO']
}
