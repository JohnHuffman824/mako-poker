/**
 * Card rank string literals.
 * All ranks use single-character representation: 2-9, T (ten), J, Q, K, A.
 */
export type RankChar = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
	'T' | 'J' | 'Q' | 'K' | 'A'

/**
 * Card suit string literals.
 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

/**
 * Represents a playing card.
 */
export interface Card {
	rank: RankChar
	suit: Suit
}

/**
 * Rank numeric values for comparison (2-14).
 */
const RANK_VALUES: Record<RankChar, number> = {
	'2': 2,
	'3': 3,
	'4': 4,
	'5': 5,
	'6': 6,
	'7': 7,
	'8': 8,
	'9': 9,
	'T': 10,
	'J': 11,
	'Q': 12,
	'K': 13,
	'A': 14
}

/**
 * Gets the numeric value of a rank (2-14).
 */
export const rankValue = (rank: RankChar): number => RANK_VALUES[rank]

/**
 * All ranks in order from low to high.
 */
export const ALL_RANKS: RankChar[] = [
	'2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'
]

/**
 * All suits.
 */
export const ALL_SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

/**
 * Creates a card from rank and suit.
 */
export function createCard(rank: RankChar, suit: Suit): Card {
	return { rank, suit }
}

/**
 * Creates a standard 52-card deck (unshuffled).
 */
export function createDeck(): Card[] {
	const deck: Card[] = []
	for (const suit of ALL_SUITS) {
		for (const rank of ALL_RANKS) {
			deck.push(createCard(rank, suit))
		}
	}
	return deck
}

/**
 * Shuffles a deck in place using Fisher-Yates algorithm.
 */
export function shuffleDeck(deck: Card[]): Card[] {
	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]]
	}
	return deck
}

/**
 * Creates a fresh shuffled deck.
 */
export function createShuffledDeck(): Card[] {
	return shuffleDeck(createDeck())
}
