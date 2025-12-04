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
} as const

export const AI_ACTION_DELAY_MS = 500
export const AUTO_DEAL_DELAY_MS = 2000
export const MAX_AI_ITERATIONS = 20

/**
 * UI component sizing constants.
 */
export const UI_SIZES = {
	TOP_SECTION_THRESHOLD: 350,
	ADD_SEAT_BUTTON_SIZE: 50,
	HERO_CARD_WIDTH: 96,
	HERO_CARD_HEIGHT: 144,
	FOLDED_OPACITY: 0.4,
} as const

/**
 * Card display configuration.
 */
export const CARD_DISPLAY = {
	SIZE_HERO: 'hero' as const,
	SIZE_OPPONENT: 'opponent' as const,
	SIZE_COMMUNITY: 'community' as const,
	COLOR_SCHEME_QUAD_TONE: 'quad-tone' as const,
} as const

/**
 * Common CSS class combinations for positioned elements.
 */
export const POSITION_CLASSES = {
	CENTERED: 'absolute -translate-x-1/2 -translate-y-1/2',
	CENTERED_Z10: 'absolute -translate-x-1/2 -translate-y-1/2 z-10',
	CENTERED_Z20: 'absolute -translate-x-1/2 -translate-y-1/2 z-20',
} as const

