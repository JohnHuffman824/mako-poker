/**
 * ONNX-based poker strategy model for GTO inference.
 */

import * as ort from 'onnxruntime-node'
import type {
	ModelInput,
	ModelOutput,
	ActionRecommendation,
	InferenceConfig
} from './types'
import { AbstractAction } from './types'

/**
 * Poker strategy model using ONNX Runtime for inference.
 * Loads trained Deep CFR models exported from Python.
 */
export class StrategyModel {
	private session: ort.InferenceSession | null = null
	private config: InferenceConfig

	constructor(config: InferenceConfig) {
		this.config = config
	}

	/**
	 * Initialize the ONNX inference session.
	 * Must be called before making predictions.
	 */
	async initialize(): Promise<void> {
		const options: ort.InferenceSession.SessionOptions = {
			executionProviders: this.config.useGpu
				? ['cuda', 'cpu']
				: ['cpu']
		}

		this.session = await ort.InferenceSession.create(
			this.config.modelPath,
			options
		)
	}

	/**
	 * Check if the model is loaded and ready for inference.
	 */
	isReady(): boolean {
		return this.session !== null
	}

	/**
	 * Run inference on the model.
	 */
	async predict(input: ModelInput): Promise<ModelOutput> {
		if (!this.session) {
			throw new Error('Model not initialized. Call initialize() first.')
		}

		// Prepare input tensors
		const bucketTensor = new ort.Tensor(
			'int64',
			BigInt64Array.from([BigInt(input.bucket)]),
			[1]
		)

		const streetTensor = new ort.Tensor(
			'int64',
			BigInt64Array.from([BigInt(input.street)]),
			[1]
		)

		const potFeaturesTensor = new ort.Tensor(
			'float32',
			Float32Array.from(input.potFeatures),
			[1, 4]
		)

		// Pad action history to at least 1 element
		const history = input.actionHistory.length > 0
			? input.actionHistory
			: [0]

		const historyTensor = new ort.Tensor(
			'int64',
			BigInt64Array.from(history.map(h => BigInt(h))),
			[1, history.length]
		)

		const lengthsTensor = new ort.Tensor(
			'int64',
			BigInt64Array.from([BigInt(history.length)]),
			[1]
		)

		// Run inference
		const feeds = {
			bucket: bucketTensor,
			street: streetTensor,
			pot_features: potFeaturesTensor,
			action_history: historyTensor,
			history_lengths: lengthsTensor
		}

		const results = await this.session.run(feeds)
		const actionValues = Array.from(
			results.action_values.data as Float32Array
		)

		// Convert to probabilities via softmax
		const strategy = this.softmax(actionValues)

		return { actionValues, strategy }
	}

	/**
	 * Get the recommended action based on model output.
	 */
	async getRecommendation(
		input: ModelInput,
		pot: number,
		stack: number
	): Promise<ActionRecommendation> {
		const output = await this.predict(input)

		// Find action with highest probability
		let maxProb = -1
		let bestAction = AbstractAction.FOLD

		for (let i = 0; i < output.strategy.length; i++) {
			if (output.strategy[i] > maxProb) {
				maxProb = output.strategy[i]
				bestAction = i as AbstractAction
			}
		}

		// Calculate concrete amount for bet/raise actions
		const amount = this.calculateBetAmount(bestAction, pot, stack)

		return {
			action: bestAction,
			probability: maxProb,
			amount
		}
	}

	/**
	 * Sample an action according to the strategy distribution.
	 * Useful for mixed strategy play.
	 */
	async sampleAction(
		input: ModelInput,
		pot: number,
		stack: number
	): Promise<ActionRecommendation> {
		const output = await this.predict(input)

		// Sample from probability distribution
		const roll = Math.random()
		let cumulative = 0
		let selectedAction = AbstractAction.FOLD

		for (let i = 0; i < output.strategy.length; i++) {
			cumulative += output.strategy[i]
			if (roll < cumulative) {
				selectedAction = i as AbstractAction
				break
			}
		}

		const amount = this.calculateBetAmount(selectedAction, pot, stack)

		return {
			action: selectedAction,
			probability: output.strategy[selectedAction],
			amount
		}
	}

	/**
	 * Calculate concrete bet amount from abstract action.
	 */
	private calculateBetAmount(
		action: AbstractAction,
		pot: number,
		stack: number
	): number | undefined {
		switch (action) {
			case AbstractAction.FOLD:
			case AbstractAction.CHECK:
			case AbstractAction.CALL:
				return undefined
			case AbstractAction.BET_HALF_POT:
				return Math.min(Math.floor(pot * 0.5), stack)
			case AbstractAction.BET_POT:
				return Math.min(pot, stack)
			case AbstractAction.BET_2X_POT:
				return Math.min(pot * 2, stack)
			case AbstractAction.ALL_IN:
				return stack
			default:
				return undefined
		}
	}

	/**
	 * Softmax function to convert values to probabilities.
	 */
	private softmax(values: number[]): number[] {
		const max = Math.max(...values)
		const exps = values.map(v => Math.exp(v - max))
		const sum = exps.reduce((a, b) => a + b, 0)
		return exps.map(e => e / sum)
	}

	/**
	 * Clean up resources.
	 */
	async dispose(): Promise<void> {
		if (this.session) {
			await this.session.release()
			this.session = null
		}
	}
}


