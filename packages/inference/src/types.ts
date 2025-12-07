/**
 * Types for ONNX model inference.
 */

/**
 * Input features for the poker strategy network.
 */
export interface ModelInput {
	/** Hand bucket index (0-168 for preflop) */
	bucket: number
	/** Street index (0=preflop, 1=flop, 2=turn, 3=river) */
	street: number
	/** Pot features: [pot_ratio, my_stack_ratio, opp_stack_ratio, bet_ratio] */
	potFeatures: [number, number, number, number]
	/** Action history as encoded indices */
	actionHistory: number[]
}

/**
 * Output from the strategy network.
 */
export interface ModelOutput {
	/** Raw action values from the network */
	actionValues: number[]
	/** Normalized strategy (probabilities) */
	strategy: number[]
}

/**
 * Abstract action types supported by the model.
 */
export enum AbstractAction {
	FOLD = 0,
	CHECK = 1,
	CALL = 2,
	BET_HALF_POT = 3,
	BET_POT = 4,
	BET_2X_POT = 5,
	ALL_IN = 6
}

/**
 * Recommended action from the model.
 */
export interface ActionRecommendation {
	action: AbstractAction
	probability: number
	/** Concrete amount for bet/raise actions */
	amount?: number
}

/**
 * Configuration for the inference session.
 */
export interface InferenceConfig {
	/** Path to the ONNX model file */
	modelPath: string
	/** Use GPU if available (default: false for Node.js compatibility) */
	useGpu?: boolean
}


