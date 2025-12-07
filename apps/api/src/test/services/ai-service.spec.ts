import { describe, it, expect, beforeEach } from 'bun:test'
import { determineAction, AIService, type ActionContext } from '../../services/ai-service'

describe('AI Service', () => {
	describe('determineAction (fallback)', () => {
		const baseContext: ActionContext = {
			toCall: 0,
			playerStack: 1000,
			lastBet: 0,
			minRaise: 20,
			pot: 30,
			street: 'preflop',
			position: 'BTN'
		}

		it('should return check or bet when not facing a bet', () => {
			const actions = new Set<string>()

			// Run multiple times to capture both outcomes
			for (let i = 0; i < 100; i++) {
				const action = determineAction(baseContext)
				actions.add(action.action)
			}

			// Should only produce check or bet
			expect(actions.has('check') || actions.has('bet')).toBe(true)
			expect(actions.has('fold')).toBe(false)
			expect(actions.has('call')).toBe(false)
		})

		it('should return fold, call, or raise when facing a bet', () => {
			const context: ActionContext = {
				...baseContext,
				toCall: 50,
				lastBet: 50
			}

			const actions = new Set<string>()

			for (let i = 0; i < 100; i++) {
				const action = determineAction(context)
				actions.add(action.action)
			}

			// Should produce fold, call, or raise
			const validActions = ['fold', 'call', 'raise']
			for (const action of actions) {
				expect(validActions).toContain(action)
			}
		})

		it('should return allin or fold when call requires entire stack', () => {
			const context: ActionContext = {
				...baseContext,
				toCall: 1000,
				lastBet: 1000
			}

			const actions = new Set<string>()

			for (let i = 0; i < 100; i++) {
				const action = determineAction(context)
				actions.add(action.action)
			}

			// Should only produce allin or fold
			for (const action of actions) {
				expect(['allin', 'fold']).toContain(action)
			}
		})

		it('should include amount for bet action', () => {
			const betActions: { action: string; amount?: number }[] = []

			for (let i = 0; i < 100; i++) {
				const action = determineAction(baseContext)
				if (action.action === 'bet') {
					betActions.push(action)
				}
			}

			// At least some bets should have been made
			if (betActions.length > 0) {
				for (const action of betActions) {
					expect(action.amount).toBeDefined()
					expect(action.amount).toBeGreaterThan(0)
					expect(action.amount).toBeLessThanOrEqual(baseContext.playerStack)
				}
			}
		})

		it('should include amount for raise action', () => {
			const context: ActionContext = {
				...baseContext,
				toCall: 50,
				lastBet: 50
			}

			const raiseActions: { action: string; amount?: number }[] = []

			for (let i = 0; i < 100; i++) {
				const action = determineAction(context)
				if (action.action === 'raise') {
					raiseActions.push(action)
				}
			}

			if (raiseActions.length > 0) {
				for (const action of raiseActions) {
					expect(action.amount).toBeDefined()
					expect(action.amount).toBeGreaterThan(context.lastBet)
				}
			}
		})
	})

	describe('AIService class', () => {
		let service: AIService

		beforeEach(() => {
			service = new AIService()
		})

		it('should not have model loaded initially', () => {
			expect(service.isModelLoaded()).toBe(false)
		})

		it('should use fallback when no model loaded', async () => {
			const context: ActionContext = {
				toCall: 0,
				playerStack: 1000,
				lastBet: 0,
				minRaise: 20,
				pot: 30,
				street: 'preflop',
				position: 'BTN'
			}

			const action = await service.getAction(context)

			// Should return valid action from fallback
			expect(['check', 'bet']).toContain(action.action)
		})

		it('should use fallback when hole cards not provided', async () => {
			const context: ActionContext = {
				toCall: 50,
				playerStack: 1000,
				lastBet: 50,
				minRaise: 20,
				pot: 100,
				street: 'flop',
				position: 'BTN'
				// Note: no holeCards
			}

			const action = await service.getAction(context)

			// Should return valid action from fallback
			expect(['fold', 'call', 'raise']).toContain(action.action)
		})
	})
})


