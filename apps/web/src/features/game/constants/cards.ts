/**
 * Card color schemes and constants for playing card rendering.
 */

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K'
export type ColorScheme = 'dual-tone' | 'quad-tone'

// Suit symbol mappings
export const SUIT_SYMBOLS: Record<Suit, string> = {
	spades: '♠',
	hearts: '♥',
	clubs: '♣',
	diamonds: '♦',
}

// Suit icon paths
export const SUIT_ICONS: Record<Suit, string> = {
	spades: '/assets/suits/spade.svg',
	hearts: '/assets/suits/heart.svg',
	clubs: '/assets/suits/club.svg',
	diamonds: '/assets/suits/diamond.svg',
}

// Dual-tone color scheme (2 colors: dark blue for black suits, red for red suits)
export const DUAL_TONE_COLORS: Record<Suit, string> = {
	spades: '#2D3748',   // Dark blue-gray
	hearts: '#DC2626',   // Red
	clubs: '#2D3748',    // Dark blue-gray
	diamonds: '#DC2626', // Red
}

// Quad-tone color scheme (4 colors: unique color per suit)
export const QUAD_TONE_COLORS: Record<Suit, string> = {
	spades: '#2D3748',   // Dark blue-gray
	hearts: '#DC2626',   // Red
	clubs: '#10B981',    // Teal/emerald
	diamonds: '#F59E0B', // Amber/yellow
}

/**
 * Get the background color for a card based on suit and color scheme.
 */
export function getCardColor(suit: Suit, scheme: ColorScheme): string {
	return scheme == 'dual-tone'
		? DUAL_TONE_COLORS[suit]
		: QUAD_TONE_COLORS[suit]
}

/**
 * Convert common suit representations to our Suit type.
 */
export function parseSuit(suitInput: string): Suit {
	const suitMap: Record<string, Suit> = {
		'♠': 'spades',
		'♥': 'hearts',
		'♣': 'clubs',
		'♦': 'diamonds',
		's': 'spades',
		'h': 'hearts',
		'c': 'clubs',
		'd': 'diamonds',
		'spades': 'spades',
		'hearts': 'hearts',
		'clubs': 'clubs',
		'diamonds': 'diamonds',
	}
	return suitMap[suitInput.toLowerCase()] ?? 'spades'
}

/**
 * Convert common rank representations to our Rank type.
 */
export function parseRank(rankInput: string): Rank {
	const rankMap: Record<string, Rank> = {
		'a': 'A', '1': 'A', 'ace': 'A',
		'2': '2', 'two': '2',
		'3': '3', 'three': '3',
		'4': '4', 'four': '4',
		'5': '5', 'five': '5',
		'6': '6', 'six': '6',
		'7': '7', 'seven': '7',
		'8': '8', 'eight': '8',
		'9': '9', 'nine': '9',
		't': 'T', '10': 'T', 'ten': 'T',
		'j': 'J', 'jack': 'J',
		'q': 'Q', 'queen': 'Q',
		'k': 'K', 'king': 'K',
	}
	return rankMap[rankInput.toLowerCase()] ?? 'A'
}

// Card back texture image
export const CARD_BACK_IMAGE = '/assets/card-back-texture.png'

