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
	usage: {
		input_tokens: 50,
		output_tokens: 25,
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

function postQuery(body: unknown) {
	return app.handle(
		new Request('http://localhost/query', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
	)
}

describe('POST /query', () => {
	beforeEach(() => {
		mockCreate.mockReset()
		mockCreate.mockResolvedValue({
			id: 'msg_test',
			type: 'message',
			role: 'assistant',
			model: 'test-model',
			content: [{ type: 'text', text: 'Test answer.' }],
			stop_reason: 'end_turn',
			stop_sequence: null,
			usage: { input_tokens: 50, output_tokens: 25 },
		})
	})

	it('returns query response for valid input', async () => {
		const response = await postQuery({
			question: 'Should I open AKs from CO?',
		})

		expect(response.status).toBe(200)
		const body = await response.json()
		expect(body.answer).toBe('Test answer.')
		expect(body.tokensUsed).toBe(75)
		expect(body.toolsUsed).toEqual([])
		expect(body.confidence).toBe('high')
		expect(body.responseTimeMs).toBeGreaterThanOrEqual(0)
	})

	it('rejects empty question', async () => {
		const response = await postQuery({ question: '' })
		expect(response.status).toBe(422)
	})

	it('rejects missing question field', async () => {
		const response = await postQuery({})
		expect(response.status).toBe(422)
	})

	it('returns 503 when Claude API fails', async () => {
		mockCreate.mockRejectedValueOnce(
			new Error('API rate limit exceeded')
		)

		const response = await postQuery({
			question: 'Will this fail?',
		})

		expect(response.status).toBe(503)
		const body = await response.json()
		expect(body.error).toBe('Unable to process query')
		expect(body.details).toBe('API rate limit exceeded')
	})
})
