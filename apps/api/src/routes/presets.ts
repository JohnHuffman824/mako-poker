import { Elysia, t } from 'elysia'
import { authMiddleware } from '../middleware/auth'
import * as presetService from '../services/preset-service'

/**
 * Preset routes — CRUD for session presets.
 * All routes require authentication.
 */
export const presetRoutes = new Elysia({ prefix: '/presets' })
	.use(authMiddleware)

	.get('/', async ({ user }) => {
		return await presetService.listPresets(user!.id)
	})

	.post('/', async ({ body, user, set }) => {
		const preset = await presetService.createPreset(
			user!.id, body
		)
		set.status = 201
		return preset
	}, {
		body: t.Object({
			name: t.String({ minLength: 1, maxLength: 100 }),
			gameType: t.String({ minLength: 1 }),
			tableSize: t.String({ minLength: 1 }),
			defaultStackBb: t.Optional(t.Number({ minimum: 1 })),
		}),
	})

	.put('/:id', async ({ params, body, user, set }) => {
		const result = await presetService.updatePreset(
			params.id, user!.id, body
		)
		if (!result) {
			set.status = 404
			return { error: 'Preset not found' }
		}
		return result
	}, {
		params: t.Object({ id: t.String() }),
		body: t.Object({
			name: t.Optional(
				t.String({ minLength: 1, maxLength: 100 })
			),
			gameType: t.Optional(t.String({ minLength: 1 })),
			tableSize: t.Optional(t.String({ minLength: 1 })),
			defaultStackBb: t.Optional(
				t.Union([t.Number({ minimum: 1 }), t.Null()])
			),
		}),
	})

	.delete('/:id', async ({ params, user, set }) => {
		const deleted = await presetService.deletePreset(
			params.id, user!.id
		)
		if (!deleted) {
			set.status = 404
			return { error: 'Preset not found' }
		}
		return { success: true }
	}, {
		params: t.Object({ id: t.String() }),
	})

	.post('/:id/activate', async ({ params, user, set }) => {
		const result = await presetService.activatePreset(
			params.id, user!.id
		)
		if (!result) {
			set.status = 404
			return { error: 'Preset not found' }
		}
		return result
	}, {
		params: t.Object({ id: t.String() }),
	})
