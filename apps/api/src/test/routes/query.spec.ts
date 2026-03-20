import { describe, it, expect, mock, beforeEach } from 'bun:test'

/**
 * Mock Claude at the system boundary so the route test
 * exercises real validation and service wiring.
 */
const mockCreate = mock(() => Promise.resolve({
	id: 'msg_test',
	type: 'message',
	role: 'assistant',
	model: 'test-model',
	content: [{ type: 'text', text: 'Test answer.' }],
	stop_reason: 'end_turn',
	stop_sequence: null,
	container: null,
	usage: {
		input_tokens: 50,
		output_tokens: 25,
		cache_creation_input_tokens: 0,
		cache_read_input_tokens: 0,
	},
}))

mock.module('../../services/claude-service', () => ({
	claude: {
		messages: { create: mockCreate },
	},
	MODEL: 'test-model',
	gtoTools: [],
}))

const { Elysia } = await import('elysia')
const { queryRoutes } = await import('../../routes/query')

const app = new Elysia().use(queryRoutes)

describe('POST /query', () => {
	beforeEach(() => {
		mockCreate.mockClear()
	})

	it('returns a query response for valid input', async () => {
		const response = await app.handle(
			new Request('http://localhost/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: 'Should I open AKs from CO?',
				}),
			})
		)

		expect(response.status).toBe(200)
		const body = await response.json()
		expect(body.answer).toBe('Test answer.')
		expect(body.tokensUsed).toBe(75)
		expect(body.toolsUsed).toEqual([])
		expect(body.confidence).toBe('high')
		expect(body.responseTimeMs).toBeGreaterThanOrEqual(0)
	})

	it('rejects empty question', async () => {
		const response = await app.handle(
			new Request('http://localhost/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: '' }),
			})
		)

		expect(response.status).toBe(422)
	})

	it('rejects missing question field', async () => {
		const response = await app.handle(
			new Request('http://localhost/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})
		)

		expect(response.status).toBe(422)
	})
})
