import type {
	Card,
	Street,
	StartGameRequest,
	PlayerActionRequest
} from '@mako/shared'

/**
 * Base event structure with timestamp and version.
 */
interface BaseEvent {
	timestamp: number
	version: number
}

/**
 * Game started event - records initial game configuration.
 */
export interface GameStartedEvent extends BaseEvent {
	type: 'GAME_STARTED'
	gameId: string
	userId: string
	config: StartGameRequest
}

/**
 * Hand dealt event - records dealer position and initial state.
 */
export interface HandDealtEvent extends BaseEvent {
	type: 'HAND_DEALT'
	gameId: string
	dealerSeatIndex: number
	holeCards: Record<number, [Card, Card]>
	deckSnapshot: Card[]
}

/**
 * Action processed event - records player action.
 */
export interface ActionProcessedEvent extends BaseEvent {
	type: 'ACTION_PROCESSED'
	gameId: string
	playerSeatIndex: number
	action: PlayerActionRequest
	resultingPot: number
	resultingStreet: Street
}

/**
 * Street advanced event - records street transition.
 */
export interface StreetAdvancedEvent extends BaseEvent {
	type: 'STREET_ADVANCED'
	gameId: string
	fromStreet: Street
	toStreet: Street
	newCommunityCards: Card[]
}

/**
 * Hand ended event - records winner and hand result.
 */
export interface HandEndedEvent extends BaseEvent {
	type: 'HAND_ENDED'
	gameId: string
	winnerSeatIndex: number | null
	winningHand: string | null
	potAmount: number
	isFoldWin: boolean
}

/**
 * Player added event - records player joining.
 */
export interface PlayerAddedEvent extends BaseEvent {
	type: 'PLAYER_ADDED'
	gameId: string
	seatIndex: number
	stack: number
}

/**
 * Player removed event - records player leaving.
 */
export interface PlayerRemovedEvent extends BaseEvent {
	type: 'PLAYER_REMOVED'
	gameId: string
	seatIndex: number
}

/**
 * Blinds updated event - records blind size change.
 */
export interface BlindsUpdatedEvent extends BaseEvent {
	type: 'BLINDS_UPDATED'
	gameId: string
	smallBlind: number
	bigBlind: number
}

/**
 * Union of all game events.
 */
export type GameEvent =
	| GameStartedEvent
	| HandDealtEvent
	| ActionProcessedEvent
	| StreetAdvancedEvent
	| HandEndedEvent
	| PlayerAddedEvent
	| PlayerRemovedEvent
	| BlindsUpdatedEvent

/**
 * Event type discriminator.
 */
export type GameEventType = GameEvent['type']

/**
 * Creates a base event with timestamp and version.
 */
export function createBaseEvent(version: number): BaseEvent {
	return {
		timestamp: Date.now(),
		version
	}
}

/**
 * Event factory functions for type-safe event creation.
 */
export const GameEvents = {
	gameStarted(
		gameId: string,
		userId: string,
		config: StartGameRequest,
		version: number
	): GameStartedEvent {
		return {
			...createBaseEvent(version),
			type: 'GAME_STARTED',
			gameId,
			userId,
			config
		}
	},

	handDealt(
		gameId: string,
		dealerSeatIndex: number,
		holeCards: Record<number, [Card, Card]>,
		deckSnapshot: Card[],
		version: number
	): HandDealtEvent {
		return {
			...createBaseEvent(version),
			type: 'HAND_DEALT',
			gameId,
			dealerSeatIndex,
			holeCards,
			deckSnapshot
		}
	},

	actionProcessed(
		gameId: string,
		playerSeatIndex: number,
		action: PlayerActionRequest,
		resultingPot: number,
		resultingStreet: Street,
		version: number
	): ActionProcessedEvent {
		return {
			...createBaseEvent(version),
			type: 'ACTION_PROCESSED',
			gameId,
			playerSeatIndex,
			action,
			resultingPot,
			resultingStreet
		}
	},

	streetAdvanced(
		gameId: string,
		fromStreet: Street,
		toStreet: Street,
		newCommunityCards: Card[],
		version: number
	): StreetAdvancedEvent {
		return {
			...createBaseEvent(version),
			type: 'STREET_ADVANCED',
			gameId,
			fromStreet,
			toStreet,
			newCommunityCards
		}
	},

	handEnded(
		gameId: string,
		winnerSeatIndex: number | null,
		winningHand: string | null,
		potAmount: number,
		isFoldWin: boolean,
		version: number
	): HandEndedEvent {
		return {
			...createBaseEvent(version),
			type: 'HAND_ENDED',
			gameId,
			winnerSeatIndex,
			winningHand,
			potAmount,
			isFoldWin
		}
	},

	playerAdded(
		gameId: string,
		seatIndex: number,
		stack: number,
		version: number
	): PlayerAddedEvent {
		return {
			...createBaseEvent(version),
			type: 'PLAYER_ADDED',
			gameId,
			seatIndex,
			stack
		}
	},

	playerRemoved(
		gameId: string,
		seatIndex: number,
		version: number
	): PlayerRemovedEvent {
		return {
			...createBaseEvent(version),
			type: 'PLAYER_REMOVED',
			gameId,
			seatIndex
		}
	},

	blindsUpdated(
		gameId: string,
		smallBlind: number,
		bigBlind: number,
		version: number
	): BlindsUpdatedEvent {
		return {
			...createBaseEvent(version),
			type: 'BLINDS_UPDATED',
			gameId,
			smallBlind,
			bigBlind
		}
	}
}

/**
 * Filters events by type with type narrowing.
 */
export function filterEventsByType<T extends GameEventType>(
	events: GameEvent[],
	type: T
): Extract<GameEvent, { type: T }>[] {
	return events.filter(e => e.type === type) as Extract<GameEvent, { type: T }>[]
}

/**
 * Gets the last event of a specific type.
 */
export function getLastEventOfType<T extends GameEventType>(
	events: GameEvent[],
	type: T
): Extract<GameEvent, { type: T }> | null {
	const filtered = filterEventsByType(events, type)
	return filtered[filtered.length - 1] ?? null
}

/**
 * Counts events by type.
 */
export function countEventsByType(events: GameEvent[]): Record<string, number> {
	return events.reduce((acc, event) => {
		acc[event.type] = (acc[event.type] ?? 0) + 1
		return acc
	}, {} as Record<string, number>)
}

