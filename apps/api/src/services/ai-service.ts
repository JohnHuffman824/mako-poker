import type { PlayerActionRequest, ActionType } from '@mako/shared'

/**
 * AI probability constants.
 */
const AI_RAISE_PROBABILITY = 0.2
const AI_ALLIN_CALL_PROBABILITY = 0.6
const AI_FOLD_PROBABILITY = 0.15
const AI_CALL_PROBABILITY = 0.85

/**
 * Context for AI decision making.
 */
export interface ActionContext {
  toCall: number
  playerStack: number
  lastBet: number
  minRaise: number
  pot: number
  street: string
  position: string
}

/**
 * Determines AI action based on game context.
 * Uses simple probability-based decision making.
 */
export function determineAction(context: ActionContext): PlayerActionRequest {
  const {
    toCall,
    playerStack,
    lastBet,
    minRaise,
    pot
  } = context

  // No bet to call - can check or bet
  if (toCall <= 0) {
    const roll = Math.random()
    if (roll < AI_RAISE_PROBABILITY) {
      // Bet roughly pot-sized (with some variance)
      const betSize = Math.max(
        minRaise * 2,
        pot * (0.5 + Math.random() * 0.5)
      )
      return {
        action: 'bet' as ActionType,
        amount: Math.min(betSize, playerStack)
      }
    }
    return { action: 'check' as ActionType }
  }

  // All-in situation (call would require all chips)
  if (toCall >= playerStack) {
    const roll = Math.random()
    if (roll < AI_ALLIN_CALL_PROBABILITY) {
      return { action: 'allin' as ActionType }
    }
    return { action: 'fold' as ActionType }
  }

  // Normal betting situation
  const roll = Math.random()

  if (roll < AI_FOLD_PROBABILITY) {
    return { action: 'fold' as ActionType }
  }

  if (roll < AI_CALL_PROBABILITY) {
    return { action: 'call' as ActionType }
  }

  // Raise
  const raiseSize = lastBet + minRaise + (minRaise * Math.random())
  return {
    action: 'raise' as ActionType,
    amount: Math.min(raiseSize, playerStack + toCall)
  }
}

