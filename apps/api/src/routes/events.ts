import { Elysia, t } from 'elysia'
import * as gameService from '../services/game-service'

/**
 * Event routes for game history and solver integration.
 * These endpoints expose the event-sourced game history for
 * AI training, debugging, and replay functionality.
 */
export const eventRoutes = new Elysia({ prefix: '/events' })

	/**
	 * Gets all events for a game.
	 * Useful for game replay and AI training.
	 */
	.get('/:gameId', async ({ params, set }) => {
		const events = gameService.getGameEvents(params.gameId)
		if (events.length === 0) {
			set.status = 404
			return { error: 'Game not found or no events recorded' }
		}
		return { events }
	}, {
		params: t.Object({
			gameId: t.String()
		})
	})

	/**
	 * Gets events filtered by type.
	 * Supports: GAME_STARTED, HAND_DEALT, ACTION_PROCESSED,
	 * STREET_ADVANCED, HAND_ENDED, PLAYER_ADDED, PLAYER_REMOVED,
	 * BLINDS_UPDATED
	 */
	.get('/:gameId/type/:eventType', async ({ params, set }) => {
		const events = gameService.getGameEventsByType(
			params.gameId,
			params.eventType as any
		)
		if (events.length === 0) {
			set.status = 404
			return { error: 'No events found for this type' }
		}
		return { events }
	}, {
		params: t.Object({
			gameId: t.String(),
			eventType: t.String()
		})
	})

	/**
	 * Gets a summary of game events.
	 * Quick overview without full event payload.
	 */
	.get('/:gameId/summary', async ({ params, set }) => {
		const summary = gameService.getGameEventSummary(params.gameId)
		if (summary.totalEvents === 0) {
			set.status = 404
			return { error: 'Game not found' }
		}
		return summary
	}, {
		params: t.Object({
			gameId: t.String()
		})
	})

	/**
	 * Gets the current version (event count) for a game.
	 * Useful for optimistic concurrency control.
	 */
	.get('/:gameId/version', async ({ params }) => {
		const version = gameService.getGameVersion(params.gameId)
		return { version }
	}, {
		params: t.Object({
			gameId: t.String()
		})
	})

	/**
	 * Gets only ACTION_PROCESSED events for training data.
	 * Returns a flattened format optimized for ML training.
	 */
	.get('/:gameId/actions', async ({ params, set }) => {
		const events = gameService.getGameEventsByType(
			params.gameId,
			'ACTION_PROCESSED'
		)
		if (events.length === 0) {
			set.status = 404
			return { error: 'No actions found' }
		}

		// Flatten for easier consumption by ML pipeline
		const actions = events.map(e => ({
			version: e.version,
			timestamp: e.timestamp,
			playerSeatIndex: (e as any).playerSeatIndex,
			action: (e as any).action,
			resultingPot: (e as any).resultingPot,
			resultingStreet: (e as any).resultingStreet
		}))

		return { actions }
	}, {
		params: t.Object({
			gameId: t.String()
		})
	})

	/**
	 * Gets hand history in a format suitable for hand analysis.
	 * Groups events by hand (between HAND_DEALT events).
	 */
	.get('/:gameId/hands', async ({ params, set }) => {
		const events = gameService.getGameEvents(params.gameId)
		if (events.length === 0) {
			set.status = 404
			return { error: 'Game not found' }
		}

		const hands: Array<{
			handNumber: number
			dealerSeat: number
			events: typeof events
			winner: number | null
			winningHand: string | null
		}> = []

		let currentHand: typeof events = []
		let handNumber = 0

		for (const event of events) {
			if (event.type === 'HAND_DEALT') {
				// Start new hand
				if (currentHand.length > 0) {
					// Save previous hand
					const handEndEvent = currentHand.find(e => e.type === 'HAND_ENDED')
					hands.push({
						handNumber,
						dealerSeat: (currentHand[0] as any).dealerSeatIndex,
						events: currentHand,
						winner: handEndEvent
							? (handEndEvent as any).winnerSeatIndex
							: null,
						winningHand: handEndEvent
							? (handEndEvent as any).winningHand
							: null
					})
				}
				handNumber++
				currentHand = [event]
			} else {
				currentHand.push(event)
			}
		}

		// Don't forget last hand
		if (currentHand.length > 0) {
			const handEndEvent = currentHand.find(e => e.type === 'HAND_ENDED')
			const firstEvent = currentHand.find(e => e.type === 'HAND_DEALT')
			hands.push({
				handNumber,
				dealerSeat: firstEvent ? (firstEvent as any).dealerSeatIndex : 0,
				events: currentHand,
				winner: handEndEvent ? (handEndEvent as any).winnerSeatIndex : null,
				winningHand: handEndEvent ? (handEndEvent as any).winningHand : null
			})
		}

		return { hands, totalHands: hands.length }
	}, {
		params: t.Object({
			gameId: t.String()
		})
	})

