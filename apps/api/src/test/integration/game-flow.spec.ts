import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as gameService from '../../services/game-service'
import type { GameState } from '@mako/shared'

/**
 * Integration tests for complete game flows.
 * Tests entire hands from deal to showdown.
 */
describe('GameFlow Integration', () => {
  let game: GameState
  let userId: string

  beforeEach(() => {
    userId = `test-user-${Date.now()}`
  })

  afterEach(() => {
    try {
      if (game) gameService.endGame(game.id, userId)
    } catch {
      // Game may already be ended
    }
  })

  describe('Complete hand - heads up', () => {
    it('plays complete hand to showdown', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      // Deal
      let state = gameService.dealHand(game.id)
      expect(state.isHandInProgress).toBe(true)
      expect(state.street).toBe('preflop')

      // Pre-flop: Button calls (posts SB, calls to BB)
      state = gameService.processAction(game.id, { action: 'call' })

      // Pre-flop: BB checks
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.street).toBe('flop')

      // Flop: First to act checks
      state = gameService.processAction(game.id, { action: 'check' })

      // Flop: Second player checks
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.street).toBe('turn')

      // Turn: Both check
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.street).toBe('river')

      // River: Both check
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })

      // Hand should be complete
      expect(state.street).toBe('showdown')
      expect(state.winner).toBeDefined()
    })

    it('ends hand when player folds pre-flop', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)

      // Button folds
      state = gameService.processAction(game.id, { action: 'fold' })

      expect(state.isHandInProgress).toBe(false)
      expect(state.winner).toBeDefined()
    })
  })

  describe('Complete hand - three players', () => {
    it('plays hand with bet and calls to showdown', () => {
      game = gameService.startGame(userId, {
        playerCount: 3,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)

      // Pre-flop: All players call/check
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.street).toBe('flop')

      // Flop: First player bets
      state = gameService.processAction(game.id, {
        action: 'bet',
        amount: 2
      })

      // Other players call
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      expect(state.street).toBe('turn')

      // Turn: All check
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.street).toBe('river')

      // River: All check
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })

      expect(state.street).toBe('showdown')
      expect(state.winner).toBeDefined()
    })

    it('handles fold mid-hand correctly', () => {
      game = gameService.startGame(userId, {
        playerCount: 3,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)

      // Pre-flop
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' })

      // Flop: Big bet causes fold
      state = gameService.processAction(game.id, {
        action: 'bet',
        amount: 10
      })
      state = gameService.processAction(game.id, { action: 'fold' })
      state = gameService.processAction(game.id, { action: 'fold' })

      // Hand ends - bettor wins
      expect(state.isHandInProgress).toBe(false)
      expect(state.winner).toBeDefined()
    })
  })

  describe('All-in scenarios', () => {
    it('handles all-in and call correctly', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 50,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)

      // Button goes all-in
      state = gameService.processAction(game.id, { action: 'allin' })
      expect(state.players.find(p => p.position === 'BTN')!.isAllIn).toBe(true)

      // BB calls
      state = gameService.processAction(game.id, { action: 'call' })

      // Hand should run out automatically to showdown
      expect(state.communityCards.length).toBe(5)
      expect(state.street).toBe('showdown')
    })
  })

  describe('Pot calculations through hand', () => {
    it('pot accumulates correctly through streets', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)
      expect(state.pot).toBe(1.5) // SB + BB

      // Button raises to 3 (BTN is also SB in heads-up, already has 0.5 in)
      state = gameService.processAction(game.id, {
        action: 'raise',
        amount: 3
      })
      // BTN adds (3 - 0.5) = 2.5, so pot = 1.5 + 2.5 = 4
      expect(state.pot).toBe(4)

      // BB calls (adds 2 more to match 3)
      state = gameService.processAction(game.id, { action: 'call' })
      expect(state.pot).toBe(6) // 4 + 2

      // Flop bet
      state = gameService.processAction(game.id, {
        action: 'bet',
        amount: 3
      })
      expect(state.pot).toBe(9)

      // Call
      state = gameService.processAction(game.id, { action: 'call' })
      expect(state.pot).toBe(12)
    })
  })

  describe('Button movement', () => {
    it('button moves clockwise after each hand', () => {
      game = gameService.startGame(userId, {
        playerCount: 3,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      // First hand
      let state = gameService.dealHand(game.id)
      const firstDealerSeat = state.dealerSeatIndex

      // End hand quickly
      state = gameService.processAction(game.id, { action: 'fold' })
      state = gameService.processAction(game.id, { action: 'fold' })

      // Second hand
      state = gameService.dealHand(game.id)
      const secondDealerSeat = state.dealerSeatIndex

      // Button should have moved
      expect(secondDealerSeat).not.toBe(firstDealerSeat)
    })
  })

  describe('Card dealing', () => {
    it('each player receives exactly 2 hole cards', () => {
      game = gameService.startGame(userId, {
        playerCount: 6,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      const state = gameService.dealHand(game.id)

      for (const player of state.players) {
        // Hero's cards are visible, AI cards hidden until showdown
        if (player.isHero) {
          expect(player.holeCards).toBeDefined()
          expect(player.holeCards!.length).toBe(2)
        }
      }
    })

    it('community cards dealt correctly per street', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)
      expect(state.communityCards.length).toBe(0)

      // Advance to flop
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.communityCards.length).toBe(3)

      // Advance to turn
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.communityCards.length).toBe(4)

      // Advance to river
      state = gameService.processAction(game.id, { action: 'check' })
      state = gameService.processAction(game.id, { action: 'check' })
      expect(state.communityCards.length).toBe(5)
    })

    it('no duplicate cards in hand', () => {
      game = gameService.startGame(userId, {
        playerCount: 6,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      // Play to showdown to reveal all cards
      let state = gameService.dealHand(game.id)

      // Advance to showdown
      while (state.street !== 'showdown' && state.isHandInProgress) {
        const currentPlayer = state.players[state.currentPlayerIndex]
        if (currentPlayer?.isFolded || currentPlayer?.isAllIn) {
          break
        }
        const toCall = state.toCall
        if (toCall > 0) {
          state = gameService.processAction(game.id, { action: 'call' })
        } else {
          state = gameService.processAction(game.id, { action: 'check' })
        }
      }

      // Collect all visible cards
      const allCards: string[] = []

      for (const player of state.players) {
        if (player.holeCards) {
          for (const card of player.holeCards) {
            const cardKey = `${card.rank}${card.suit}`
            expect(allCards).not.toContain(cardKey)
            allCards.push(cardKey)
          }
        }
      }

      for (const card of state.communityCards) {
        const cardKey = `${card.rank}${card.suit}`
        expect(allCards).not.toContain(cardKey)
        allCards.push(cardKey)
      }
    })
  })

  describe('Stack management', () => {
    it('stacks update correctly after winning pot', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      let state = gameService.dealHand(game.id)

      // One player folds, other wins blinds
      state = gameService.processAction(game.id, { action: 'fold' })

      // Winner should have gained the blinds
      // Find winner by matching seatIndex (object comparison won't work)
      const winnerSeat = state.winner?.seatIndex
      expect(winnerSeat).toBeDefined()
      const winner = state.players.find(p => p.seatIndex === winnerSeat)
      expect(winner).toBeDefined()
      // BB posted 1, SB posted 0.5, winner gets 1.5
      // If winner was BB: started with 99 (after posting), wins 1.5 = 100.5
      // If winner was BTN/SB: started with 99.5 (after posting), wins 1.5 = 101
      expect(winner!.stack).toBeGreaterThanOrEqual(100)
    })
  })

  describe('Multi-hand game session', () => {
    it('can play multiple hands in sequence', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })

      // Play 3 hands
      for (let i = 0; i < 3; i++) {
        let state = gameService.dealHand(game.id)
        expect(state.isHandInProgress).toBe(true)

        // Quick fold
        state = gameService.processAction(game.id, { action: 'fold' })
        expect(state.isHandInProgress).toBe(false)
      }
    })
  })
})

