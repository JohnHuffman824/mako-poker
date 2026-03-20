import { describe, it, expect, mock, beforeEach } from 'bun:test'
import type Anthropic from '@anthropic-ai/sdk'

/**
 * Mock the Claude client at the module level.
 * Testing rules allow mocking at system boundaries (external APIs).
 */
const mockCreate = mock(() => Promise.resolve({}))

mock.module('../../services/claude-service', () => ({
	claude: {
		messages: { create: mockCreate },
	},
	MODEL: 'test-model',
	gtoTools: [
		{ name: 'get_hand_recommendation', input_schema: {} },
		{ name: 'lookup_preflop_range', input_schema: {} },
		{ name: 'lookup_push_fold', input_schema: {} },
	],
}))

const { handleQuery } = await import(
	'../../services/query-service'
)

function textResponse(
	text: string
): Partial<Anthropic.Message> {
	return {
		id: 'msg_test',
		type: 'message',
		role: 'assistant',
		model: 'test-model',
		content: [{ type: 'text', text } as never],
		stop_reason: 'end_turn',
		stop_sequence: null,
		usage: {
			input_tokens: 100,
			output_tokens: 50,
		} as Anthropic.Usage,
	}
}

function toolUseResponse(
	toolName: string,
	input: Record<string, unknown>
): Partial<Anthropic.Message> {
	return {
		id: 'msg_test',
		type: 'message',
		role: 'assistant',
		model: 'test-model',
		content: [{
			type: 'tool_use',
			id: 'toolu_test123',
			name: toolName,
			input,
		} as never],
		stop_reason: 'tool_use',
		stop_sequence: null,
		usage: {
			input_tokens: 100,
			output_tokens: 30,
		} as Anthropic.Usage,
	}
}

describe('QueryService', () => {
	beforeEach(() => {
		mockCreate.mockReset()
	})

	describe('handleQuery', () => {
		it('returns answer from a simple text response',
			async () => {
				mockCreate.mockResolvedValueOnce(
					textResponse('You should raise AKs here.')
				)

				const result = await handleQuery(
					'Should I raise AKs from the CO?'
				)

				expect(result.answer).toBe(
					'You should raise AKs here.'
				)
				expect(result.tokensUsed).toBe(150)
				expect(result.responseTimeMs)
					.toBeGreaterThanOrEqual(0)
			}
		)

		it('dispatches tool calls to gto-service', async () => {
			mockCreate.mockResolvedValueOnce(
				toolUseResponse('get_hand_recommendation', {
					hand: 'AKs',
					position: 'CO',
					scenario: 'open',
					stack_depth_bb: 100,
					table_size: '6max',
				})
			)
			mockCreate.mockResolvedValueOnce(
				textResponse(
					'Based on GTO data, AKs is a pure raise.'
				)
			)

			const result = await handleQuery(
				'Should I open AKs from CO at 100BB 6max?'
			)

			expect(result.answer).toBe(
				'Based on GTO data, AKs is a pure raise.'
			)
			expect(result.toolsUsed).toContain(
				'get_hand_recommendation'
			)
			expect(mockCreate).toHaveBeenCalledTimes(2)
		})

		it('tracks total tokens across tool call loop',
			async () => {
				mockCreate.mockResolvedValueOnce(
					toolUseResponse('lookup_preflop_range', {
						position: 'BTN',
						scenario: 'open',
						stack_depth_bb: 100,
						table_size: '6max',
					})
				)
				mockCreate.mockResolvedValueOnce(
					textResponse('Here is the BTN range.')
				)

				const result = await handleQuery(
					'What is the BTN opening range?'
				)

				// 130 from first + 150 from second
				expect(result.tokensUsed).toBe(280)
			}
		)

		it('handles unknown tool name gracefully', async () => {
			mockCreate.mockResolvedValueOnce(
				toolUseResponse('unknown_tool', { foo: 'bar' })
			)
			mockCreate.mockResolvedValueOnce(
				textResponse('I could not find that data.')
			)

			const result = await handleQuery('Some question')

			expect(result.answer).toBe(
				'I could not find that data.'
			)
		})

		it('returns high confidence without tools', async () => {
			mockCreate.mockResolvedValueOnce(
				textResponse('Simple answer.')
			)

			const result = await handleQuery('Hello')

			expect(result.confidence).toBe('high')
		})

		it('returns low confidence after exhausted rounds',
			async () => {
				// All 5 rounds return tool_use
				for (let i = 0; i < 5; i++) {
					mockCreate.mockResolvedValueOnce(
						toolUseResponse('lookup_preflop_range', {
							position: 'BTN',
							scenario: 'open',
							stack_depth_bb: 100,
							table_size: '6max',
						})
					)
				}

				const result = await handleQuery(
					'Infinite loop question'
				)

				expect(result.confidence).toBe('low')
				expect(result.answer).toContain(
					'unable to complete'
				)
				expect(mockCreate).toHaveBeenCalledTimes(5)
			}
		)

		it('propagates Claude API errors', async () => {
			mockCreate.mockRejectedValueOnce(
				new Error('API rate limit exceeded')
			)

			expect(
				handleQuery('Will this fail?')
			).rejects.toThrow('API rate limit exceeded')
		})
	})
})
