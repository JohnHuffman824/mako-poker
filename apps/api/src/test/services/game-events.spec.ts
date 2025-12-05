import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as gameService from '../../services/game-service'
import type { GameState } from '@mako/shared'

/**
 * Tests for the event-sourced game state management.
 * Verifies that events are recorded correctly during game play.
 */
describe('GameEvents', () => {
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

	describe('Event recording', () => {
		it('records GAME_STARTED event when game starts', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			const events = gameService.getGameEvents(game.id)
			expect(events.length).toBe(1)
			expect(events[0].type).toBe('GAME_STARTED')
		})

		it('records HAND_DEALT event when hand is dealt', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.dealHand(game.id)

			const events = gameService.getGameEvents(game.id)
			const handDealtEvents = events.filter(e => e.type === 'HAND_DEALT')
			expect(handDealtEvents.length).toBe(1)
		})

		it('records ACTION_PROCESSED events for player actions', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'call' })
			gameService.processAction(game.id, { action: 'check' })

			const events = gameService.getGameEvents(game.id)
			const actionEvents = events.filter(e => e.type === 'ACTION_PROCESSED')
			expect(actionEvents.length).toBe(2)
		})

		it('records HAND_ENDED event when hand completes', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'fold' })

			const events = gameService.getGameEvents(game.id)
			const handEndedEvents = events.filter(e => e.type === 'HAND_ENDED')
			expect(handEndedEvents.length).toBe(1)
		})

		it('records PLAYER_ADDED event when player joins', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.addPlayerAtSeat(game.id, 5)

			const events = gameService.getGameEvents(game.id)
			const playerAddedEvents = events.filter(e => e.type === 'PLAYER_ADDED')
			expect(playerAddedEvents.length).toBe(1)
		})

		it('records PLAYER_REMOVED event when player leaves', () => {
			game = gameService.startGame(userId, {
				playerCount: 3,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.removePlayerAtSeat(game.id, 2)

			const events = gameService.getGameEvents(game.id)
			const playerRemovedEvents = events.filter(
				e => e.type === 'PLAYER_REMOVED'
			)
			expect(playerRemovedEvents.length).toBe(1)
		})

		it('records BLINDS_UPDATED event when blinds change', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.updateBlinds(game.id, 1, 2)

			const events = gameService.getGameEvents(game.id)
			const blindsEvents = events.filter(e => e.type === 'BLINDS_UPDATED')
			expect(blindsEvents.length).toBe(1)
		})
	})

	describe('Event versioning', () => {
		it('increments version with each event', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			expect(gameService.getGameVersion(game.id)).toBe(1)

			gameService.dealHand(game.id)
			expect(gameService.getGameVersion(game.id)).toBe(2)

			gameService.processAction(game.id, { action: 'fold' })
			// Fold generates action event + hand ended event
			expect(gameService.getGameVersion(game.id)).toBeGreaterThanOrEqual(3)
		})

		it('events have sequential version numbers', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'call' })
			gameService.processAction(game.id, { action: 'check' })

			const events = gameService.getGameEvents(game.id)
			for (let i = 0; i < events.length; i++) {
				expect(events[i].version).toBe(i + 1)
			}
		})
	})

	describe('Event summary', () => {
		it('provides accurate event summary', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'call' })
			gameService.processAction(game.id, { action: 'check' })

			const summary = gameService.getGameEventSummary(game.id)

			expect(summary.totalEvents).toBeGreaterThanOrEqual(4)
			expect(summary.handsPlayed).toBe(1)
			expect(summary.actionsProcessed).toBe(2)
			expect(summary.createdAt).toBeDefined()
			expect(summary.updatedAt).toBeDefined()
		})
	})

	describe('Complete hand event sequence', () => {
		it('records correct event sequence for complete hand', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			// Play a complete hand to showdown
			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'call' })
			gameService.processAction(game.id, { action: 'check' })
			// Flop
			gameService.processAction(game.id, { action: 'check' })
			gameService.processAction(game.id, { action: 'check' })
			// Turn
			gameService.processAction(game.id, { action: 'check' })
			gameService.processAction(game.id, { action: 'check' })
			// River
			gameService.processAction(game.id, { action: 'check' })
			gameService.processAction(game.id, { action: 'check' })

			const events = gameService.getGameEvents(game.id)
			const eventTypes = events.map(e => e.type)

			// Should have: GAME_STARTED, HAND_DEALT, multiple ACTION_PROCESSED,
			// multiple STREET_ADVANCED, HAND_ENDED
			expect(eventTypes).toContain('GAME_STARTED')
			expect(eventTypes).toContain('HAND_DEALT')
			expect(eventTypes).toContain('ACTION_PROCESSED')
			expect(eventTypes).toContain('HAND_ENDED')
		})

		it('records fold win correctly', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'fold' })

			const events = gameService.getGameEvents(game.id)
			const handEndedEvent = events.find(e => e.type === 'HAND_ENDED')

			expect(handEndedEvent).toBeDefined()
			expect((handEndedEvent as any).isFoldWin).toBe(true)
		})
	})

	describe('Multiple hands', () => {
		it('records events for multiple hands correctly', () => {
			game = gameService.startGame(userId, {
				playerCount: 2,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1
			})

			// First hand
			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'fold' })

			// Second hand
			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'fold' })

			// Third hand
			gameService.dealHand(game.id)
			gameService.processAction(game.id, { action: 'fold' })

			const summary = gameService.getGameEventSummary(game.id)
			expect(summary.handsPlayed).toBe(3)
		})
	})
})

