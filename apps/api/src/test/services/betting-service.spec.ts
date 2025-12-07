import { describe, it, expect, beforeEach } from 'bun:test'
import {
	handleFold,
	handleCall,
	handleRaise,
	handleAllIn,
	isBettingRoundComplete
} from '../../services/betting-service'
import { createTestInternalGame } from '../helpers'
import type { InternalGameState } from '../../domain/game-state'
import type { Player } from '@mako/shared'

describe('BettingService', () => {
	let game: InternalGameState
	let player: Player

	beforeEach(() => {
		game = createTestInternalGame({
			pot: 1.5,
			lastBet: 1,
			minRaise: 1
		})
		player = game.players[0]
		player.stack = 100
		player.currentBet = 0
	})

	describe('handleFold', () => {
		it('marks player as folded', () => {
			handleFold(player)

			expect(player.isFolded).toBe(true)
			expect(player.lastAction).toBe('Fold')
		})
	})

	describe('handleCall', () => {
		it('deducts correct amount from stack when calling', () => {
			handleCall(game, player)

			expect(player.stack).toBe(99)
			expect(player.currentBet).toBe(1)
			expect(player.lastAction).toBe('Call')
		})

		it('sets check action when no bet to call', () => {
			game.lastBet = 0
			handleCall(game, player)

			expect(player.stack).toBe(100)
			expect(player.lastAction).toBe('Check')
		})

		it('goes all-in if bet exceeds stack', () => {
			player.stack = 0.5
			handleCall(game, player)

			expect(player.stack).toBe(0)
			expect(player.isAllIn).toBe(true)
			expect(player.lastAction).toBe('All-in')
		})
	})

	describe('handleRaise', () => {
		it('raises to specified amount', () => {
			handleRaise(game, player, 4)

			expect(player.currentBet).toBe(4)
			expect(player.stack).toBe(96)
			expect(game.lastBet).toBe(4)
		})

		it('throws error for raise below minimum', () => {
			expect(() => handleRaise(game, player, 1.5)).toThrow()
		})

		it('allows all-in for less than minimum raise', () => {
			player.stack = 1.5
			handleRaise(game, player, 1.5)

			expect(player.isAllIn).toBe(true)
		})

		it('displays raise as "RAISE TO X BB" format', () => {
			game.blinds = { small: 0.5, big: 1 }
			game.lastBet = 1
			game.minRaise = 1

			handleRaise(game, player, 2)

			expect(player.lastAction).toBe('RAISE TO 2 BB')
		})

		it('displays raise with decimal BBs correctly', () => {
			game.blinds = { small: 0.5, big: 1 }
			game.lastBet = 1
			game.minRaise = 1

			handleRaise(game, player, 2.5)

			expect(player.lastAction).toBe('RAISE TO 2.5 BB')
		})

		it('rounds total BBs to one decimal place', () => {
			game.blinds = { small: 0.5, big: 1 }
			game.lastBet = 1
			game.minRaise = 1

			// Raise to 2.87 should display as 2.9 BB
			handleRaise(game, player, 2.87)

			expect(player.lastAction).toBe('RAISE TO 2.9 BB')
		})

		it('displays correct BBs when no active bet exists', () => {
			game.blinds = { small: 0.5, big: 1 }
			game.lastBet = 0 // No active bet (e.g., first to act on flop)
			game.minRaise = 1

			// Bet 4 chips should display as 4 BB
			handleRaise(game, player, 4)

			expect(player.lastAction).toBe('RAISE TO 4 BB')
			expect(game.lastBet).toBe(4)
		})

		it('displays correct BBs with player having posted blind', () => {
			game.blinds = { small: 0.5, big: 1 }
			game.lastBet = 1
			game.minRaise = 1
			player.currentBet = 0.5 // Player posted small blind

			// Raise to 4 chips total should display as 4 BB
			handleRaise(game, player, 4)

			expect(player.lastAction).toBe('RAISE TO 4 BB')
			expect(player.currentBet).toBe(4)
			expect(player.stack).toBe(96.5) // 100 - 0.5 (already bet) - 3.5 (added)
		})

		it('displays correct BBs with non-standard big blind', () => {
			game.blinds = { small: 0.57, big: 1.14 }
			game.lastBet = 0
			game.minRaise = 1.14
			player.currentBet = 0

			// Raise to 4.56 chips (4 BB) should display as 4 BB
			handleRaise(game, player, 4.56)

			expect(player.lastAction).toBe('RAISE TO 4 BB')
			expect(game.lastBet).toBe(4.56)
		})

		it('displays 3.5 BB correctly when betting 3.99 chips with 1.14 BB', () => {
			game.blinds = { small: 0.57, big: 1.14 }
			game.lastBet = 0
			game.minRaise = 1.14
			player.currentBet = 0

			// Raise to 3.99 chips = 3.5 BB (3.99 / 1.14 ≈ 3.5)
			handleRaise(game, player, 3.99)

			expect(player.lastAction).toBe('RAISE TO 3.5 BB')
			expect(game.lastBet).toBe(3.99)
		})

		it('updates minRaise to raise size', () => {
			game.lastBet = 2
			game.minRaise = 1

			handleRaise(game, player, 5)

			// Raise size is 5 - 2 = 3
			expect(game.minRaise).toBe(3)
		})
	})

	describe('handleAllIn', () => {
		it('puts player all-in', () => {
			handleAllIn(game, player)

			expect(player.stack).toBe(0)
			expect(player.isAllIn).toBe(true)
			expect(player.currentBet).toBe(100)
			expect(game.pot).toBe(101.5)
		})

		it('updates minRaise correctly when all-in is a raise', () => {
			game.lastBet = 10
			game.minRaise = 5
			player.stack = 30
			player.currentBet = 0

			handleAllIn(game, player)

			// All-in amount is 30, last bet was 10
			// Raise size is 30 - 10 = 20
			expect(game.minRaise).toBe(20)
			expect(game.lastBet).toBe(30)
		})

		it('does not update minRaise when all-in is below current bet', () => {
			game.lastBet = 50
			game.minRaise = 10
			player.stack = 20
			player.currentBet = 0

			handleAllIn(game, player)

			// All-in amount (20) is less than lastBet (50)
			// Should not update minRaise or lastBet
			expect(game.minRaise).toBe(10)
			expect(game.lastBet).toBe(50)
		})

		it('correctly handles all-in when player has already bet', () => {
			game.lastBet = 10
			game.minRaise = 5
			player.stack = 20
			player.currentBet = 5

			handleAllIn(game, player)

			// Total all-in amount is stack + currentBet = 20 + 5 = 25
			// Raise size is 25 - 10 = 15
			expect(player.currentBet).toBe(25)
			expect(game.minRaise).toBe(15)
			expect(game.lastBet).toBe(25)
		})
	})

	describe('isBettingRoundComplete', () => {
		it('returns true when all active players have equal bets', () => {
			game.players[0].currentBet = 2
			game.players[0].lastAction = 'Call'
			game.players[1].currentBet = 2
			game.players[1].lastAction = 'Raise 2 BB'

			expect(isBettingRoundComplete(game)).toBe(true)
		})

		it('returns false when bets are unequal', () => {
			game.players[0].currentBet = 1
			game.players[0].lastAction = 'Call'
			game.players[1].currentBet = 2
			game.players[1].lastAction = 'Raise 2 BB'

			expect(isBettingRoundComplete(game)).toBe(false)
		})
	})
})

