import type { Card, Player } from '@mako/shared'

/**
 * Creates a new player.
 */
export function createPlayer(params: {
  seatIndex: number
  stack: number
  isHero: boolean
  position?: string
}): Player {
  return {
    seatIndex: params.seatIndex,
    position: params.position ?? '',
    stack: params.stack,
    holeCards: null,
    lastAction: null,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    isHero: params.isHero
  }
}

/**
 * Resets player state for a new hand.
 */
export function resetPlayer(player: Player): void {
  player.holeCards = null
  player.currentBet = 0
  player.isFolded = false
  player.isAllIn = false
  player.lastAction = null
}

/**
 * Checks if player can take an action.
 */
export function canAct(player: Player): boolean {
  return !player.isFolded && !player.isAllIn && player.stack > 0
}

/**
 * Deals hole cards to a player.
 */
export function dealCards(player: Player, cards: Card[]): void {
  player.holeCards = cards
}

/**
 * Converts player to DTO format, optionally hiding cards.
 */
export function playerToDto(player: Player, showCards: boolean): Player {
  return {
    ...player,
    holeCards: showCards ? player.holeCards : null
  }
}

