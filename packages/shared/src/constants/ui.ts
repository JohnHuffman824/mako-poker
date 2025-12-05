/**
 * UI component sizing constants.
 */
export const UI_SIZES = {
	TOP_SECTION_THRESHOLD: 350,
	ADD_SEAT_BUTTON_SIZE: 50,
	HERO_CARD_WIDTH: 96,
	HERO_CARD_HEIGHT: 144,
	FOLDED_OPACITY: 0.4
} as const

/**
 * Card display configuration.
 */
export const CARD_DISPLAY = {
	SIZE_HERO: 'hero' as const,
	SIZE_OPPONENT: 'opponent' as const,
	SIZE_COMMUNITY: 'community' as const,
	COLOR_SCHEME_QUAD_TONE: 'quad-tone' as const
} as const

/**
 * Common CSS class combinations for positioned elements.
 */
export const POSITION_CLASSES = {
	CENTERED: 'absolute -translate-x-1/2 -translate-y-1/2',
	CENTERED_Z10: 'absolute -translate-x-1/2 -translate-y-1/2 z-10',
	CENTERED_Z20: 'absolute -translate-x-1/2 -translate-y-1/2 z-20'
} as const

