/**
 * Tests for gameStore state management.
 * Tests state transitions and error handling without internal mocks.
 */

import { describe, it, expect, afterEach } from 'bun:test'
import { useGameStore } from '../../store/gameStore'

describe('Game Store', () => {

	describe('Initial State', () => {

		it('has correct initial values', () => {
			const store = useGameStore.getState()

			expect(store.game).toBeNull()
			expect(store.isLoading).toBe(false)
			expect(store.autoDeal).toBe(false)
			expect(store.error).toBeNull()
		})
	})

	describe('Error Handling', () => {

		it('sets error state when provided', () => {
			// Manually set error (simulating failed API call)
			useGameStore.setState({ error: 'Test error message' })

			expect(useGameStore.getState().error).toBe('Test error message')
		})

		it('clearError clears error state', () => {
			const store = useGameStore.getState()

			// Set an error
			useGameStore.setState({ error: 'Test error' })
			expect(useGameStore.getState().error).toBe('Test error')

			// Clear it
			store.clearError()
			expect(useGameStore.getState().error).toBeNull()
		})
	})

	describe('Auto Deal Toggle', () => {

		it('setAutoDeal enables auto deal', () => {
			const store = useGameStore.getState()

			expect(store.autoDeal).toBe(false)

			store.setAutoDeal(true)

			expect(useGameStore.getState().autoDeal).toBe(true)
		})

		it('setAutoDeal disables auto deal', () => {
			const store = useGameStore.getState()

			useGameStore.setState({ autoDeal: true })
			expect(useGameStore.getState().autoDeal).toBe(true)

			store.setAutoDeal(false)

			expect(useGameStore.getState().autoDeal).toBe(false)
		})

		it('toggles autoDeal multiple times', () => {
			const store = useGameStore.getState()

			store.setAutoDeal(true)
			expect(useGameStore.getState().autoDeal).toBe(true)

			store.setAutoDeal(false)
			expect(useGameStore.getState().autoDeal).toBe(false)

			store.setAutoDeal(true)
			expect(useGameStore.getState().autoDeal).toBe(true)
		})
	})

	describe('Loading State', () => {

		it('can set loading state', () => {
			useGameStore.setState({ isLoading: true })
			expect(useGameStore.getState().isLoading).toBe(true)

			useGameStore.setState({ isLoading: false })
			expect(useGameStore.getState().isLoading).toBe(false)
		})
	})

	describe('Game State Updates', () => {

		it('can update game state', () => {
			const mockGame = {
				id: 'test-id',
				playerCount: 6,
				players: [],
				heroSeatIndex: 0,
				dealerSeatIndex: 5,
				currentPlayerIndex: 0,
				pot: 1.5,
				street: 'preflop' as const,
				communityCards: [],
				isHandInProgress: true,
				blinds: { small: 0.5, big: 1.0 },
				minRaise: 2.0,
				maxRaise: 100.0,
				toCall: 1.0,
				winner: null,
				winningHand: null,
				availableActions: null,
				actionOrderSeats: [],
				isShowdown: false,
				sidePots: [],
				playerContributions: {},
				lastBet: 0
			}

			useGameStore.setState({ game: mockGame })

			const state = useGameStore.getState()
			expect(state.game).not.toBeNull()
			expect(state.game?.id).toBe('test-id')
			expect(state.game?.playerCount).toBe(6)
		})
	})

	// Reset store after each test
	afterEach(() => {
		useGameStore.setState({
			game: null,
			isLoading: false,
			autoDeal: false,
			error: null,
		})
	})
})
