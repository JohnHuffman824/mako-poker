import type { Card, Rank, Suit } from '@mako/shared'
import {
	ALL_RANKS,
	ALL_SUITS,
	formatCardDisplay,
	rankFromSymbol,
	suitFromSymbol,
	rankSymbol
} from '@mako/shared'

/**
 * Creates a card from rank and suit.
 */
export function createCard(rank: Rank, suit: Suit): Card {
	return {
		rank,
		suit,
		display: formatCardDisplay(rank, suit)
	}
}

/**
 * Creates a card from notation string (e.g., "As", "Th", "2c").
 * @param notation Two-character string: rank + suit symbol
 * @throws Error if notation is invalid
 */
export function cardFromNotation(notation: string): Card {
	if (notation.length < 2 || notation.length > 3) {
		throw new Error(`Card notation must be 2-3 characters: ${notation}`)
	}

	const rankStr = notation.slice(0, -1)
	const suitChar = notation.slice(-1)

	const rank = rankFromSymbol(rankStr)
	const suit = suitFromSymbol(suitChar)

	return createCard(rank, suit)
}

/**
 * Converts card to short notation (e.g., "As", "Th").
 */
export function cardToNotation(card: Card): string {
	return `${rankSymbol(card.rank)}${card.suit[0]}`
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
