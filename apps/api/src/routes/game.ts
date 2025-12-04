import { Elysia, t } from 'elysia'
import { authMiddleware } from '../middleware/auth'
import * as gameService from '../services/game-service'

/**
 * Game routes with JWT authentication.
 */
export const gameRoutes = new Elysia({ prefix: '/game' })
	.use(authMiddleware)

	.post('/start', async ({ body, user }) => {
		if (!user) {
			return { error: 'Unauthorized' }
		}
		return gameService.startGame(user.id, body)
	}, {
		body: t.Object({
			playerCount: t.Number({ minimum: 2, maximum: 10 }),
			startingStack: t.Optional(t.Number({ minimum: 1 })),
			smallBlind: t.Optional(t.Number({ minimum: 0.01 })),
			bigBlind: t.Optional(t.Number({ minimum: 0.01 }))
		})
	})

	.get('/current', async ({ user }) => {
		if (!user) {
			return { error: 'Unauthorized' }
		}
		const game = gameService.getUserGame(user.id)
		if (!game) {
			return { error: 'No active game' }
		}
		return game
	})

	.get('/:id', async ({ params }) => {
		const game = gameService.getGame(params.id)
		if (!game) {
			return { error: 'Game not found' }
		}
		return game
	}, {
		params: t.Object({
			id: t.String()
		})
	})

	.post('/:id/deal', async ({ params, set }) => {
		try {
			return gameService.dealHand(params.id)
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String()
		})
	})

	.post('/:id/action', async ({ params, body, set }) => {
		try {
			return gameService.processAction(params.id, {
				action: body.action as 'fold' | 'call' | 'check' | 'raise' | 'bet' |
					'allin',
				amount: body.amount
			})
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String()
		}),
		body: t.Object({
			action: t.String(),
			amount: t.Optional(t.Number())
		})
	})

	.post('/:id/ai-action', async ({ params, set }) => {
		try {
			return gameService.processAiAction(params.id)
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String()
		})
	})

	.post('/:id/seat/:seatIndex', async ({ params, set }) => {
		try {
			return gameService.addPlayerAtSeat(params.id, parseInt(params.seatIndex))
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String(),
			seatIndex: t.String()
		})
	})

	.delete('/:id/seat/:seatIndex', async ({ params, set }) => {
		try {
			return gameService.removePlayerAtSeat(
				params.id,
				parseInt(params.seatIndex)
			)
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String(),
			seatIndex: t.String()
		})
	})

	.patch('/:id/players', async ({ params, query, set }) => {
		try {
			const count = parseInt(query.count ?? '0')
			return gameService.updatePlayerCount(params.id, count)
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String()
		})
	})

	.patch('/:id/blinds', async ({ params, body, set }) => {
		try {
			return gameService.updateBlinds(
				params.id,
				body.smallBlind,
				body.bigBlind
			)
		} catch (error) {
			if (error instanceof Error) {
				set.status = 400
				return { error: error.message }
			}
			throw error
		}
	}, {
		params: t.Object({
			id: t.String()
		}),
		body: t.Object({
			smallBlind: t.Number(),
			bigBlind: t.Number()
		})
	})

	.delete('/:id', async ({ params, user, set }) => {
		if (!user) {
			set.status = 401
			return { error: 'Unauthorized' }
		}

		gameService.endGame(params.id, user.id)
		return { message: 'Game ended' }
	}, {
		params: t.Object({
			id: t.String()
		})
	})

