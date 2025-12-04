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
	})

	describe('handleAllIn', () => {
		it('puts player all-in', () => {
			handleAllIn(game, player)

			expect(player.stack).toBe(0)
			expect(player.isAllIn).toBe(true)
			expect(player.currentBet).toBe(100)
			expect(game.pot).toBe(101.5)
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

