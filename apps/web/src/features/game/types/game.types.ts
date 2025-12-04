/**
 * Re-export game types from shared package.
 * This ensures frontend and backend use the same type definitions.
 */
export type {
	Card,
	Rank,
	Suit,
	Player,
	Blinds,
	Street,
	GameState,
	StartGameRequest,
	PlayerActionRequest,
	ActionType,
	SidePot,
	AvailableActions
} from '@mako/shared'

// Re-export for backwards compatibility with existing code
// that may import from this file
