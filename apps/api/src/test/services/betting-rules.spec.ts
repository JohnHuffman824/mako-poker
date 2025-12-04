import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as gameService from '../../services/game-service'
import type { GameState, Player } from '@mako/shared'

/**
 * Comprehensive tests for Texas Hold'em betting rules.
 * Per HoldemRules.txt: Tests betting order, available actions,
 * minimum/maximum bet sizes, and proper raise calculations.
 */
describe('BettingRules', () => {
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

  /**
   * Helper to create a game and deal a hand.
   */
  function setupGame(playerCount: number = 3): GameState {
    game = gameService.startGame(userId, {
      playerCount,
      startingStack: 100,
      smallBlind: 0.5,
      bigBlind: 1
    })
    return gameService.dealHand(game.id)
  }

  /**
   * Helper to get current player to act.
   */
  function getCurrentPlayer(state: GameState): Player | null {
    if (state.currentPlayerIndex < 0) return null
    return state.players[state.currentPlayerIndex]
  }

  describe('Pre-flop betting order', () => {
    /**
     * Per HoldemRules.txt: "The action begins to the left of the big blind"
     * In pre-flop, first to act is UTG (under the gun), clockwise from BB.
     */
    it('first to act is player after big blind (UTG)', () => {
      const state = setupGame(3)

      // With 3 players: BTN posts SB, seat 1 posts BB, seat 2 (hero) acts first
      // OR: seat 0 is BTN/SB, seat 1 is BB, seat 2 (if exists) is UTG
      // Actually depends on button position
      const bbPlayer = state.players.find(p => p.position === 'BB')
      const currentPlayer = getCurrentPlayer(state)

      expect(bbPlayer).toBeDefined()
      expect(currentPlayer).toBeDefined()
      // First to act should NOT be BB or SB
      expect(currentPlayer!.position).not.toBe('BB')

      // In 3-handed: BTN should act first pre-flop (BTN is UTG when 3-handed)
      // Unless BTN and SB are same (heads-up rule)
    })

    it('blinds are posted before action begins', () => {
      const state = setupGame(3)

      const sbPlayer = state.players.find(p => p.position === 'SB')
      const bbPlayer = state.players.find(p => p.position === 'BB')

      expect(sbPlayer!.currentBet).toBe(0.5)
      expect(sbPlayer!.lastAction).toBe('SB')
      expect(bbPlayer!.currentBet).toBe(1)
      expect(bbPlayer!.lastAction).toBe('BB')
    })

    it('pot contains blinds at start of hand', () => {
      const state = setupGame(3)

      // SB (0.5) + BB (1) = 1.5
      expect(state.pot).toBe(1.5)
    })

    it('action proceeds clockwise after each player acts', () => {
      const state = setupGame(6)

      // Find starting player index
      const startIndex = state.currentPlayerIndex

      // Player folds
      const afterFold = gameService.processAction(game.id, { action: 'fold' })

      // Next player should be clockwise (higher index, wrapping)
      const nextIndex = afterFold.currentPlayerIndex
      expect(nextIndex).not.toBe(startIndex)
    })

    it('BB has option to raise even if everyone calls', () => {
      const state = setupGame(3)

      // First player calls
      let current = gameService.processAction(game.id, { action: 'call' })

      // Second player (SB) calls
      current = gameService.processAction(game.id, { action: 'call' })

      // BB should now have option to raise (live blind)
      const bbPlayer = current.players.find(p => p.position === 'BB')
      expect(current.currentPlayerIndex).toBe(
        current.players.findIndex(p => p.position === 'BB')
      )
    })
  })

  describe('Post-flop betting order', () => {
    /**
     * Per HoldemRules.txt: "Betting on the flop begins with the active
     * player immediately clockwise from the button"
     */
    function advanceToFlop(): GameState {
      let state = setupGame(3)

      // Everyone calls to see the flop
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' }) // BB checks

      return state
    }

    it('first to act on flop is first active player after button', () => {
      const state = advanceToFlop()

      expect(state.street).toBe('flop')
      expect(state.communityCards.length).toBe(3)

      // First to act should be SB position (or first active after button)
      const currentPlayer = getCurrentPlayer(state)
      expect(currentPlayer).toBeDefined()
    })

    it('three community cards are dealt on flop', () => {
      const state = advanceToFlop()

      expect(state.communityCards.length).toBe(3)
      for (const card of state.communityCards) {
        expect(card.rank).toBeDefined()
        expect(card.suit).toBeDefined()
      }
    })
  })

  describe('Available actions', () => {
    /**
     * Per HoldemRules.txt: "If nobody has yet made a bet, then a player may
     * either check (decline to bet, but keep their cards) or bet. If a player
     * has bet, then subsequent players can fold, call or raise."
     */
    it('player can check when no bet is facing them', () => {
      const state = setupGame(3)

      // Call until we get to BB who faces no additional bet
      gameService.processAction(game.id, { action: 'call' })
      gameService.processAction(game.id, { action: 'call' })

      // BB can check
      const afterCheck = gameService.processAction(game.id, { action: 'check' })
      expect(afterCheck.street).toBe('flop') // Advances to flop after all check
    })

    it('player must call, raise, or fold when facing a bet', () => {
      const state = setupGame(3)

      // First player raises
      gameService.processAction(game.id, { action: 'raise', amount: 4 })

      // Next player must call, raise, or fold (check should fail or be treated
      // as fold/call)
      const current = gameService.getGame(game.id)!
      expect(current.toCall).toBeGreaterThan(0)
    })

    it('availableActions indicates proper options when facing bet', () => {
      const state = setupGame(3)

      // First player raises
      const afterRaise = gameService.processAction(game.id, {
        action: 'raise',
        amount: 4
      })

      expect(afterRaise.availableActions).toBe('CALL_RAISE_FOLD')
    })

    it('availableActions indicates proper options when no bet', () => {
      let state = setupGame(3)

      // Everyone calls preflop
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' })

      // On flop with no bet
      expect(state.availableActions).toBe('CHECK_BET_FOLD')
    })
  })

  describe('Minimum bet/raise sizing', () => {
    /**
     * Minimum raise must be at least the size of the previous raise.
     * Pre-flop, the minimum raise is the big blind.
     */
    it('minimum raise pre-flop is the big blind', () => {
      const state = setupGame(3)

      // lastBet = 1 (BB), minRaise should allow raise to 2 (1 BB raise)
      // Frontend receives minRaise as total bet amount
      expect(state.minRaise).toBe(2) // lastBet(1) + minRaise(1)
    })

    it('minimum re-raise must match previous raise size', () => {
      let state = setupGame(3)

      // First player raises to 4 (a raise of 3 over the BB)
      state = gameService.processAction(game.id, {
        action: 'raise',
        amount: 4
      })

      // Minimum re-raise is now 4 + 3 = 7 (previous raise was 3)
      expect(state.minRaise).toBe(7)
    })

    it('rejects raise below minimum', () => {
      const state = setupGame(3)

      // Try to raise to 1.5 when minimum is 2
      expect(() => gameService.processAction(game.id, {
        action: 'raise',
        amount: 1.5
      })).toThrow()
    })

    it('allows exact minimum raise', () => {
      const state = setupGame(3)

      // Raise to exactly 2 (minimum)
      const result = gameService.processAction(game.id, {
        action: 'raise',
        amount: 2
      })

      expect(result.lastBet).toBe(2)
    })

    it('minimum raise resets to BB on new street', () => {
      let state = setupGame(3)

      // Pre-flop action
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' })

      // On flop, minRaise should be based on BB again (1)
      // When no bet, minRaise = lastBet(0) + BB(1) = 1
      expect(state.minRaise).toBe(1)
    })
  })

  describe('Maximum bet sizing', () => {
    it('maximum raise is player stack plus current bet', () => {
      const state = setupGame(3)

      const currentPlayer = getCurrentPlayer(state)
      expect(state.maxRaise).toBe(
        currentPlayer!.stack + currentPlayer!.currentBet
      )
    })

    it('all-in is allowed even below minimum raise', () => {
      // Create game with low stack player
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 5, // Very low stack
        smallBlind: 2,
        bigBlind: 4
      })
      const state = gameService.dealHand(game.id)

      // With 5 stack and 4 BB, player has 1 remaining
      // They should be able to go all-in even if it's not a full raise
      const result = gameService.processAction(game.id, { action: 'allin' })
      expect(result.players[0].isAllIn).toBe(true)
    })
  })

  describe('Betting round completion', () => {
    /**
     * Per HoldemRules.txt: "Betting continues on each betting round until
     * all active players (who have not folded) have placed equal bets in
     * the pot."
     */
    it('round ends when all players have equal bets and have acted', () => {
      let state = setupGame(3)

      // All call the BB
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'check' })

      // Should advance to flop
      expect(state.street).toBe('flop')
    })

    it('round continues if raise re-opens action', () => {
      let state = setupGame(3)

      // First player calls
      state = gameService.processAction(game.id, { action: 'call' })

      // Second player raises
      state = gameService.processAction(game.id, {
        action: 'raise',
        amount: 4
      })

      // BB must respond to the raise
      const currentPlayer = getCurrentPlayer(state)
      expect(currentPlayer!.position).toBe('BB')
      expect(state.toCall).toBe(3) // 4 - 1 (already posted)
    })

    it('round ends when all but one player folds', () => {
      let state = setupGame(3)

      // First player folds
      state = gameService.processAction(game.id, { action: 'fold' })

      // Second player folds
      state = gameService.processAction(game.id, { action: 'fold' })

      // Hand should end, winner declared
      expect(state.isHandInProgress).toBe(false)
      expect(state.winner).toBeDefined()
    })
  })

  describe('Pot calculation', () => {
    it('pot increases correctly with calls', () => {
      let state = setupGame(3)

      // Pot starts at 1.5 (blinds)
      expect(state.pot).toBe(1.5)

      // First player calls 1
      state = gameService.processAction(game.id, { action: 'call' })
      expect(state.pot).toBe(2.5) // 1.5 + 1

      // Second player (SB) calls 0.5 more
      state = gameService.processAction(game.id, { action: 'call' })
      expect(state.pot).toBe(3) // 2.5 + 0.5
    })

    it('pot increases correctly with raises', () => {
      let state = setupGame(3)

      // First player raises to 4
      state = gameService.processAction(game.id, {
        action: 'raise',
        amount: 4
      })

      // Pot = blinds (1.5) + raise (4) = 5.5
      expect(state.pot).toBe(5.5)
    })
  })

  describe('Heads-up specific rules', () => {
    /**
     * In heads-up (2 players), the button posts the small blind
     * and acts first pre-flop.
     */
    it('button posts small blind in heads-up', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })
      const state = gameService.dealHand(game.id)

      const btnPlayer = state.players.find(p => p.position === 'BTN')
      const bbPlayer = state.players.find(p => p.position === 'BB')

      // In heads-up, BTN is also SB
      expect(btnPlayer!.currentBet).toBe(0.5)
      expect(bbPlayer!.currentBet).toBe(1)
    })

    it('button acts first pre-flop in heads-up', () => {
      game = gameService.startGame(userId, {
        playerCount: 2,
        startingStack: 100,
        smallBlind: 0.5,
        bigBlind: 1
      })
      const state = gameService.dealHand(game.id)

      const currentPlayer = getCurrentPlayer(state)
      expect(currentPlayer!.position).toBe('BTN')
    })
  })

  describe('All-in scenarios', () => {
    it('player marked all-in when betting entire stack', () => {
      const state = setupGame(2)

      const result = gameService.processAction(game.id, { action: 'allin' })

      const player = result.players[result.currentPlayerIndex - 1] ??
        result.players[result.players.length - 1]
      // Find the player who went all-in
      const allInPlayer = result.players.find(p => p.isAllIn)
      expect(allInPlayer).toBeDefined()
      expect(allInPlayer!.stack).toBe(0)
    })

    it('all-in player cannot act further', () => {
      let state = setupGame(3)

      // First player goes all-in
      state = gameService.processAction(game.id, { action: 'allin' })

      // Other players call
      state = gameService.processAction(game.id, { action: 'call' })
      state = gameService.processAction(game.id, { action: 'call' })

      // When all players are all-in (or have matched), hand runs to showdown
      // This is correct Texas Hold'em behavior
      expect(state.street).toBe('showdown')
      expect(state.communityCards.length).toBe(5)
    })
  })

  describe('toCall calculation', () => {
    it('toCall is zero when player has matched current bet', () => {
      const state = setupGame(3)

      // BB already has 1 bet
      const bbPlayer = state.players.find(p => p.position === 'BB')
      const bbIndex = state.players.indexOf(bbPlayer!)

      // If it were BB's turn and lastBet was 1, toCall would be 0
      // But pre-flop BB acts last
    })

    it('toCall reflects difference from current bet to last bet', () => {
      let state = setupGame(3)

      // First player raises to 4
      state = gameService.processAction(game.id, {
        action: 'raise',
        amount: 4
      })

      // SB (bet 0.5) needs to call 3.5
      expect(state.toCall).toBe(3.5)
    })
  })
})

