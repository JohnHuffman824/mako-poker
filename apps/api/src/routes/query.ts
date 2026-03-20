import { Elysia, t } from 'elysia'
import { handleQuery } from '../services/query-service'

/**
 * Query route — the main ask-and-answer endpoint.
 * No auth required for Milestone 1.
 */
export const queryRoutes = new Elysia()
	.post('/query', async ({ body }) => {
		const result = await handleQuery(body.question)
		return result
	}, {
		body: t.Object({
			question: t.String({ minLength: 1 }),
		}),
	})
