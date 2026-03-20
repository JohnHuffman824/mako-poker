/**
 * Query orchestration — the main ask-and-answer flow.
 *
 * Receives a user question, calls Claude with GTO tools,
 * handles tool calls, and returns the final response.
 */

import type Anthropic from '@anthropic-ai/sdk'
import { claude, MODEL, gtoTools } from './claude-service'
import { buildSystemPrompt } from '../prompts/system'
import {
	lookupPreflopRange,
	lookupPushFold,
	getHandRecommendation,
} from './gto-service'

type MessageParam = Anthropic.MessageParam
type ToolResultBlockParam = Anthropic.ToolResultBlockParam

export interface QueryResponse {
	answer: string
	confidence: 'high' | 'medium' | 'low'
	toolsUsed: string[]
	tokensUsed: number
	responseTimeMs: number
}

const MAX_TOOL_ROUNDS = 5

export async function handleQuery(
	question: string,
	presetContext?: string
): Promise<QueryResponse> {
	const start = Date.now()
	const toolsUsed: string[] = []
	let totalTokens = 0
	let confidence: 'high' | 'medium' | 'low' = 'high'

	const messages: MessageParam[] = [
		{ role: 'user', content: question },
	]

	for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
		const response = await claude.messages.create({
			model: MODEL,
			max_tokens: 1024,
			system: buildSystemPrompt(presetContext),
			tools: gtoTools,
			messages,
		})

		totalTokens +=
			response.usage.input_tokens +
			response.usage.output_tokens

		if (response.stop_reason != 'tool_use') {
			return {
				answer: extractText(response.content),
				confidence,
				toolsUsed,
				tokensUsed: totalTokens,
				responseTimeMs: Date.now() - start,
			}
		}

		// Process tool calls
		const toolResults = await processToolCalls(
			response.content, toolsUsed
		)

		// Check if any tool returned interpolated data
		for (const result of toolResults) {
			const content = result.content as string
			if (content.includes('"medium"') ||
				content.includes('"interpolated"')) {
				confidence = 'medium'
			}
		}

		// Add assistant message + tool results to conversation
		messages.push({ role: 'assistant', content: response.content })
		messages.push({ role: 'user', content: toolResults })
	}

	// Exhausted tool rounds — return what we have
	return {
		answer: 'I was unable to complete the analysis. ' +
			'Please try a simpler question.',
		confidence: 'low',
		toolsUsed,
		tokensUsed: totalTokens,
		responseTimeMs: Date.now() - start,
	}
}

function extractText(
	content: Anthropic.ContentBlock[]
): string {
	return content
		.filter((block) => block.type == 'text')
		.map((block) => {
			if (block.type == 'text') return block.text
			return ''
		})
		.join('\n')
}

async function processToolCalls(
	content: Anthropic.ContentBlock[],
	toolsUsed: string[]
): Promise<ToolResultBlockParam[]> {
	const results: ToolResultBlockParam[] = []

	for (const block of content) {
		if (block.type != 'tool_use') continue

		toolsUsed.push(block.name)
		const result = await executeTool(
			block.name, block.input as Record<string, unknown>
		)

		results.push({
			type: 'tool_result',
			tool_use_id: block.id,
			content: JSON.stringify(result),
		})
	}

	return results
}

async function executeTool(
	name: string,
	input: Record<string, unknown>
): Promise<unknown> {
	switch (name) {
		case 'lookup_preflop_range':
			return await lookupPreflopRange(
				input.position as string,
				input.scenario as string,
				input.stack_depth_bb as number,
				input.table_size as string
			)

		case 'lookup_push_fold':
			return await lookupPushFold(
				input.position as string,
				input.stack_depth_bb as number,
				input.table_size as string
			)

		case 'get_hand_recommendation':
			return await getHandRecommendation(
				input.hand as string,
				input.position as string,
				input.scenario as string,
				input.stack_depth_bb as number,
				input.table_size as string
			)

		default:
			return {
				error: `Unknown tool: ${name}`,
			}
	}
}
