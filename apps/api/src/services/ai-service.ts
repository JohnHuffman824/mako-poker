import type { PlayerActionRequest, ActionType, Card } from '@mako/shared'

/**
 * AI probability constants for fallback behavior.
 */
const AI_RAISE_PROBABILITY = 0.2
const AI_ALLIN_CALL_PROBABILITY = 0.6
const AI_FOLD_PROBABILITY = 0.15
const AI_CALL_PROBABILITY = 0.85

/**
 * Rounds a bet amount to the nearest 0.5 BB increment.
 * This creates cleaner bet sizes (1 BB, 1.5 BB, 2 BB, etc.)
 * instead of arbitrary decimals like 2.873 BB.
 */
function roundToHalfBB(amount: number, bigBlind: number): number {
	const amountInBBs = amount / bigBlind
	const roundedBBs = Math.round(amountInBBs * 2) / 2
	return roundedBBs * bigBlind
}

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
	holeCards?: Card[]
	communityCards?: Card[]
}

/**
 * AI Service for poker decision making.
 *
 * Supports two modes:
 * 1. ONNX inference using trained Deep CFR models (when available)
 * 2. Fallback probability-based decisions (when no model loaded)
 *
 * Usage:
 *   // With trained model (production)
 *   const ai = new AIService()
 *   await ai.loadModel('path/to/strategy_network_latest.onnx')
 *   const action = await ai.determineAction(context)
 *
 *   // Without model (development/testing)
 *   const action = determineAction(context)  // uses fallback
 */
export class AIService {
	private model: import('@mako/inference').StrategyModel | null = null

	/**
	 * Load an ONNX model for GTO-based decisions.
	 */
	async loadModel(modelPath: string): Promise<void> {
		const { StrategyModel } = await import('@mako/inference')
		this.model = new StrategyModel({ modelPath })
		await this.model.initialize()
	}

	/**
	 * Check if a trained model is loaded.
	 */
	isModelLoaded(): boolean {
		return this.model?.isReady() ?? false
	}

	/**
	 * Determine action using loaded model or fallback.
	 */
	async getAction(context: ActionContext): Promise<PlayerActionRequest> {
		if (this.model && context.holeCards) {
			return this.getModelAction(context)
		}
		return determineAction(context)
	}

	/**
	 * Get action from ONNX model.
	 */
	private async getModelAction(
		context: ActionContext
	): Promise<PlayerActionRequest> {
		if (!this.model || !context.holeCards) {
			throw new Error('Model not loaded or missing hole cards')
		}

		const { getBucket } = await import('@mako/inference')

		const streetIndex = this.streetToIndex(context.street)
		const bucket = getBucket(
			context.holeCards,
			context.communityCards ?? []
		)

		const totalChips = context.playerStack + context.pot
		const input = {
			bucket,
			street: streetIndex,
			potFeatures: [
				context.pot / totalChips,
				context.playerStack / totalChips,
				context.playerStack / totalChips,
				context.toCall / Math.max(1, context.pot)
			] as [number, number, number, number],
			actionHistory: []
		}

		const recommendation = await this.model.sampleAction(
			input,
			context.pot,
			context.playerStack
		)

		return this.convertAction(recommendation, context)
	}

	/**
	 * Convert abstract action to concrete PlayerActionRequest.
	 */
	private async convertAction(
		rec: import('@mako/inference').ActionRecommendation,
		context: ActionContext
	): Promise<PlayerActionRequest> {
		const { AbstractAction } = await import('@mako/inference')

		switch (rec.action) {
			case AbstractAction.FOLD:
				return { action: 'fold' as ActionType }
			case AbstractAction.CHECK:
				return { action: 'check' as ActionType }
			case AbstractAction.CALL:
				return { action: 'call' as ActionType }
			case AbstractAction.ALL_IN:
				return { action: 'allin' as ActionType }
			case AbstractAction.BET_HALF_POT:
			case AbstractAction.BET_POT:
			case AbstractAction.BET_2X_POT:
				if (context.toCall <= 0) {
					return {
						action: 'bet' as ActionType,
						amount: rec.amount ?? context.minRaise
					}
				}
				return {
					action: 'raise' as ActionType,
					amount: rec.amount ?? context.lastBet + context.minRaise
				}
			default:
				return { action: 'check' as ActionType }
		}
	}

	/**
	 * Convert street string to index.
	 */
	private streetToIndex(street: string): number {
		switch (street) {
			case 'preflop': return 0
			case 'flop': return 1
			case 'turn': return 2
			case 'river': return 3
			default: return 0
		}
	}

	/**
	 * Clean up resources.
	 */
	async dispose(): Promise<void> {
		if (this.model) {
			await this.model.dispose()
			this.model = null
		}
	}
}

/**
 * Fallback: Determines AI action based on simple probabilities.
 * Used when no trained model is available.
 */
export function determineAction(context: ActionContext): PlayerActionRequest {
	const {
		toCall,
		playerStack,
		lastBet,
		minRaise,
		pot
	} = context

	// Infer big blind from minRaise (typically equals BB)
	const bigBlind = minRaise

	// No bet to call - can check or bet
	if (toCall <= 0) {
		const roll = Math.random()
		if (roll < AI_RAISE_PROBABILITY) {
			// Bet roughly pot-sized (with some variance)
			const rawBetSize = Math.max(
				minRaise * 2,
				pot * (0.5 + Math.random() * 0.5)
			)
			const betSize = roundToHalfBB(rawBetSize, bigBlind)
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
	const rawRaiseSize = lastBet + minRaise + (minRaise * Math.random())
	const raiseSize = roundToHalfBB(rawRaiseSize, bigBlind)
	return {
		action: 'raise' as ActionType,
		amount: Math.min(raiseSize, playerStack + toCall)
	}
}

