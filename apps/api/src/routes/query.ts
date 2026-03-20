import { Elysia, t } from 'elysia'
import { handleQuery } from '../services/query-service'

/**
 * Query route — the main ask-and-answer endpoint.
 * No auth required for Milestone 1.
 */
export const queryRoutes = new Elysia()
	.post('/query', async ({ body, set }) => {
		try {
			return await handleQuery(body.question)
		} catch (err) {
			set.status = 503
			return {
				error: 'Unable to process query',
				details: err instanceof Error
					? err.message
					: 'Unknown error',
			}
		}
	}, {
		body: t.Object({
			question: t.String({
				minLength: 1,
				maxLength: 2000,
			}),
		}),
	})
