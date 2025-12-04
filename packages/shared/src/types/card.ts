/**
 * Card rank string literals.
 */
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
  '10' | 'J' | 'Q' | 'K' | 'A'

/**
 * Card suit string literals.
 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

/**
 * Represents a playing card.
 */
export interface Card {
  rank: Rank
  suit: Suit
  display: string
}

/**
 * Rank data: numeric value for comparison, symbol for notation.
 */
const RANK_DATA: Record<Rank, { value: number; symbol: string }> = {
  '2': { value: 2, symbol: '2' },
  '3': { value: 3, symbol: '3' },
  '4': { value: 4, symbol: '4' },
  '5': { value: 5, symbol: '5' },
  '6': { value: 6, symbol: '6' },
  '7': { value: 7, symbol: '7' },
  '8': { value: 8, symbol: '8' },
  '9': { value: 9, symbol: '9' },
  '10': { value: 10, symbol: 'T' },
  'J': { value: 11, symbol: 'J' },
  'Q': { value: 12, symbol: 'Q' },
  'K': { value: 13, symbol: 'K' },
  'A': { value: 14, symbol: 'A' }
}

/**
 * Suit data: symbol for notation.
 */
const SUIT_DATA: Record<Suit, { symbol: string }> = {
  hearts: { symbol: 'h' },
  diamonds: { symbol: 'd' },
  clubs: { symbol: 'c' },
  spades: { symbol: 's' }
}

/**
 * Gets the numeric value of a rank (2-14).
 */
export const rankValue = (rank: Rank): number => RANK_DATA[rank].value

/**
 * Gets the notation symbol for a rank (2-9, T, J, Q, K, A).
 */
export const rankSymbol = (rank: Rank): string => RANK_DATA[rank].symbol

/**
 * Gets the notation symbol for a suit (h, d, c, s).
 */
export const suitSymbol = (suit: Suit): string => SUIT_DATA[suit].symbol

/**
 * All ranks in order from low to high.
 */
export const ALL_RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'
]

/**
 * All suits.
 */
export const ALL_SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

/**
 * Creates a display string for a card.
 */
export function formatCardDisplay(rank: Rank, suit: Suit): string {
  return `${rank}${suitSymbol(suit)}`
}

/**
 * Parses a rank from its symbol (handles T for 10).
 */
export function rankFromSymbol(symbol: string): Rank {
  const upper = symbol.toUpperCase()
  if (upper === 'T') return '10'
  const rank = ALL_RANKS.find(r => r === upper || r === symbol)
  if (!rank) throw new Error(`Invalid rank symbol: ${symbol}`)
  return rank
}

/**
 * Parses a suit from its symbol (h, d, c, s).
 */
export function suitFromSymbol(symbol: string): Suit {
  const lower = symbol.toLowerCase()
  const entry = Object.entries(SUIT_DATA).find(([, data]) =>
    data.symbol === lower
  )
  if (!entry) throw new Error(`Invalid suit symbol: ${symbol}`)
  return entry[0] as Suit
}
