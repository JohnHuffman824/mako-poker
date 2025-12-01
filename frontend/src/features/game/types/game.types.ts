/**
 * Represents a playing card.
 */
export interface Card {
  rank: string
  suit: string
  display: string
}

/**
 * Represents a player at the table.
 */
export interface Player {
  seatIndex: number
  position: string
  stack: number
  holeCards: Card[] | null
  lastAction: string | null
  isFolded: boolean
  isAllIn: boolean
  currentBet: number
  isHero: boolean
}

/**
 * Represents blinds configuration.
 */
export interface Blinds {
  small: number
  big: number
}

/**
 * Possible street values.
 */
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

/**
 * Complete game state from the backend.
 */
export interface GameState {
  id: string
  playerCount: number
  players: Player[]
  heroSeatIndex: number
  dealerIndex: number
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
 * Player action types.
 */
export type ActionType = 'fold' | 'call' | 'check' | 'raise' | 'bet' | 'allin'

/**
 * Request to submit a player action.
 */
export interface PlayerActionRequest {
  action: ActionType
  amount?: number
}

