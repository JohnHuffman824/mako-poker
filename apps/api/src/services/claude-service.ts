/**
 * Claude API client with GTO tool definitions.
 *
 * Wraps the Anthropic SDK and defines the tools Claude can
 * call during poker coaching conversations.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Tool } from '@anthropic-ai/sdk/resources/messages'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey || apiKey == 'your-api-key-here') {
	process.stderr.write(
		'Warning: ANTHROPIC_API_KEY not configured. ' +
		'Claude queries will fail.\n'
	)
}

export const claude = new Anthropic({ apiKey: apiKey ?? '' })

export const MODEL = 'claude-sonnet-4-20250514'

/**
 * Tool definitions for Claude's GTO lookups.
 *
 * These map directly to gto-service functions:
 * - lookup_preflop_range -> lookupPreflopRange
 * - lookup_push_fold -> lookupPushFold
 * - get_hand_recommendation -> getHandRecommendation
 */
export const gtoTools: Tool[] = [
	{
		name: 'lookup_preflop_range',
		description:
			'Look up GTO preflop ranges for a specific position, ' +
			'scenario, stack depth, and table size. Returns the ' +
			'complete range with action frequencies for all 169 ' +
			'hand combos. Use this for broad range questions like ' +
			'"what should I open from the CO?"',
		input_schema: {
			type: 'object' as const,
			properties: {
				position: {
					type: 'string',
					description:
						'Position at the table. One of: UTG, UTG1, ' +
						'MP, HJ, CO, BTN, SB, BB',
				},
				scenario: {
					type: 'string',
					description:
						'The action scenario. "open" for opening ' +
						'ranges, or "vs_X_open" for facing an open ' +
						'(e.g., "vs_utg_open", "vs_co_open", ' +
						'"vs_btn_open")',
				},
				stack_depth_bb: {
					type: 'number',
					description:
						'Effective stack depth in big blinds (e.g., ' +
						'20, 40, 100)',
				},
				table_size: {
					type: 'string',
					description:
						'Table format. One of: "6max", "9max"',
				},
			},
			required: [
				'position', 'scenario',
				'stack_depth_bb', 'table_size',
			],
		},
	},
	{
		name: 'lookup_push_fold',
		description:
			'Look up push/fold chart for short-stack tournament ' +
			'play. Returns whether each of the 169 hands should ' +
			'push (all-in) or fold. Use this for short-stack ' +
			'questions (typically 20BB or less).',
		input_schema: {
			type: 'object' as const,
			properties: {
				position: {
					type: 'string',
					description:
						'Position at the table. One of: UTG, UTG1, ' +
						'MP, HJ, CO, BTN, SB',
				},
				stack_depth_bb: {
					type: 'number',
					description:
						'Stack depth in big blinds (typically 5-20)',
				},
				table_size: {
					type: 'string',
					description:
						'Table format. One of: "6max", "9max"',
				},
			},
			required: [
				'position', 'stack_depth_bb', 'table_size',
			],
		},
	},
	{
		name: 'get_hand_recommendation',
		description:
			'Get the GTO recommendation for a specific hand in a ' +
			'specific situation. Returns the recommended action, ' +
			'frequency, and any alternative actions. Use this for ' +
			'specific hand questions like "should I raise AKs from ' +
			'the CO?"',
		input_schema: {
			type: 'object' as const,
			properties: {
				hand: {
					type: 'string',
					description:
						'Hand in standard notation (e.g., "AKs", ' +
						'"AKo", "TT", "98s"). Use T for ten, ' +
						's for suited, o for offsuit.',
				},
				position: {
					type: 'string',
					description:
						'Position at the table. One of: UTG, UTG1, ' +
						'MP, HJ, CO, BTN, SB, BB',
				},
				scenario: {
					type: 'string',
					description:
						'The action scenario. "open" for opening, ' +
						'or "vs_X_open" for facing an open.',
				},
				stack_depth_bb: {
					type: 'number',
					description:
						'Effective stack depth in big blinds',
				},
				table_size: {
					type: 'string',
					description:
						'Table format. One of: "6max", "9max"',
				},
			},
			required: [
				'hand', 'position', 'scenario',
				'stack_depth_bb', 'table_size',
			],
		},
	},
]
