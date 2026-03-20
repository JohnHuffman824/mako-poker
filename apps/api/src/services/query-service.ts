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

/** Claude gets 5 rounds of tool use before we stop */
const MAX_TOOL_ROUNDS = 5

export async function handleQuery(
	question: string
): Promise<QueryResponse> {
	const start = Date.now()
	const state = {
		toolsUsed: [] as string[],
		totalTokens: 0,
		confidence: 'high' as 'high' | 'medium' | 'low',
	}

	const messages: MessageParam[] = [
		{ role: 'user', content: question },
	]

	for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
		const response = await callClaude(messages)
		accumulateTokens(state, response)

		if (response.stop_reason != 'tool_use') {
			return buildResponse(
				extractText(response.content),
				state, start
			)
		}

		const toolResults = await processToolCalls(
			response.content, state
		)
		messages.push({
			role: 'assistant', content: response.content,
		})
		messages.push({ role: 'user', content: toolResults })
	}

	return buildResponse(
		'I was unable to complete the analysis. ' +
		'Please try a simpler question.',
		{ ...state, confidence: 'low' }, start
	)
}

async function callClaude(
	messages: MessageParam[]
): Promise<Anthropic.Message> {
	return await claude.messages.create({
		model: MODEL,
		max_tokens: 1024,
		system: buildSystemPrompt(),
		tools: gtoTools,
		messages,
	})
}

function accumulateTokens(
	state: { totalTokens: number },
	response: Anthropic.Message
): void {
	state.totalTokens +=
		response.usage.input_tokens +
		response.usage.output_tokens
}

function buildResponse(
	answer: string,
	state: {
		confidence: 'high' | 'medium' | 'low'
		toolsUsed: string[]
		totalTokens: number
	},
	start: number
): QueryResponse {
	return {
		answer,
		confidence: state.confidence,
		toolsUsed: state.toolsUsed,
		tokensUsed: state.totalTokens,
		responseTimeMs: Date.now() - start,
	}
}

function extractText(
	content: Anthropic.ContentBlock[]
): string {
	const texts: string[] = []
	for (const block of content) {
		if (block.type == 'text') texts.push(block.text)
	}
	return texts.join('\n')
}

async function processToolCalls(
	content: Anthropic.ContentBlock[],
	state: { toolsUsed: string[]; confidence: string }
): Promise<ToolResultBlockParam[]> {
	const results: ToolResultBlockParam[] = []

	for (const block of content) {
		if (block.type != 'tool_use') continue

		state.toolsUsed.push(block.name)
		const result = await executeTool(
			block.name, block.input as Record<string, unknown>
		)

		const json = JSON.stringify(result)
		if (json.includes('"interpolated"')) {
			state.confidence = 'medium'
		}

		results.push({
			type: 'tool_result',
			tool_use_id: block.id,
			content: json,
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
			return { error: `Unknown tool: ${name}` }
	}
}
