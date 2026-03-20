/**
 * GTO Lookup Service — queries preflop ranges and push/fold charts.
 *
 * Provides the data layer for Claude's tool calls.
 * Never generates numbers — only returns curated data from the DB.
 */

import { db } from '../db/client'
import { preflopRanges, pushFoldCharts } from '../db/schema'
import { eq, and } from 'drizzle-orm'

type ActionFrequencies = Record<string, number>
type RangeTable = Record<string, ActionFrequencies>
type PushFoldRanges = Record<string, string>

export interface PreflopRangeResult {
	ranges: RangeTable
	confidence: 'high' | 'medium' | 'low'
	matchType: 'exact' | 'interpolated'
}

export interface PushFoldResult {
	ranges: PushFoldRanges
	confidence: 'high' | 'medium' | 'low'
}

export interface HandRecommendation {
	action: string
	frequency: number
	alternatives?: Array<{ action: string; frequency: number }>
}

const PREFLOP_STACK_DEPTHS = [10, 15, 20, 25, 30, 40, 50, 75, 100]
const PUSH_FOLD_STACK_DEPTHS = [5, 8, 10, 15, 20]

function findNearestDepth(
	target: number,
	buckets: number[]
): number {
	let nearest = buckets[0]
	let minDist = Math.abs(target - nearest)
	for (const depth of buckets) {
		const dist = Math.abs(target - depth)
		if (dist < minDist) {
			minDist = dist
			nearest = depth
		}
	}
	return nearest
}

export async function lookupPreflopRange(
	position: string,
	scenario: string,
	stackDepthBb: number,
	tableSize: string
): Promise<PreflopRangeResult | null> {
	// Try exact match first
	const exact = await db
		.select()
		.from(preflopRanges)
		.where(
			and(
				eq(preflopRanges.position, position),
				eq(preflopRanges.scenario, scenario),
				eq(preflopRanges.stackDepthBb, stackDepthBb),
				eq(preflopRanges.tableSize, tableSize)
			)
		)
		.limit(1)

	if (exact.length > 0) {
		return {
			ranges: exact[0].ranges as RangeTable,
			confidence: 'high',
			matchType: 'exact',
		}
	}

	// Try nearest stack depth bucket
	const nearest = findNearestDepth(stackDepthBb, PREFLOP_STACK_DEPTHS)
	if (nearest == stackDepthBb) return null

	const interpolated = await db
		.select()
		.from(preflopRanges)
		.where(
			and(
				eq(preflopRanges.position, position),
				eq(preflopRanges.scenario, scenario),
				eq(preflopRanges.stackDepthBb, nearest),
				eq(preflopRanges.tableSize, tableSize)
			)
		)
		.limit(1)

	if (interpolated.length > 0) {
		return {
			ranges: interpolated[0].ranges as RangeTable,
			confidence: 'medium',
			matchType: 'interpolated',
		}
	}

	return null
}

export async function lookupPushFold(
	position: string,
	stackDepthBb: number,
	tableSize: string
): Promise<PushFoldResult | null> {
	// Try exact match first
	const exact = await db
		.select()
		.from(pushFoldCharts)
		.where(
			and(
				eq(pushFoldCharts.position, position),
				eq(pushFoldCharts.stackDepthBb, stackDepthBb),
				eq(pushFoldCharts.tableSize, tableSize)
			)
		)
		.limit(1)

	if (exact.length > 0) {
		return {
			ranges: exact[0].ranges as PushFoldRanges,
			confidence: 'high',
		}
	}

	// Try nearest stack depth bucket
	const nearest = findNearestDepth(
		stackDepthBb, PUSH_FOLD_STACK_DEPTHS
	)
	if (nearest == stackDepthBb) return null

	const interpolated = await db
		.select()
		.from(pushFoldCharts)
		.where(
			and(
				eq(pushFoldCharts.position, position),
				eq(pushFoldCharts.stackDepthBb, nearest),
				eq(pushFoldCharts.tableSize, tableSize)
			)
		)
		.limit(1)

	if (interpolated.length > 0) {
		return {
			ranges: interpolated[0].ranges as PushFoldRanges,
			confidence: 'medium',
		}
	}

	return null
}

export async function getHandRecommendation(
	hand: string,
	position: string,
	scenario: string,
	stackDepthBb: number,
	tableSize: string
): Promise<HandRecommendation | null> {
	const rangeResult = await lookupPreflopRange(
		position, scenario, stackDepthBb, tableSize
	)

	if (!rangeResult) return null

	const handActions = rangeResult.ranges[hand]
	if (!handActions) return null

	// Find the primary action (highest frequency)
	// Tiebreaker: prefer raise > call > fold
	const actionPriority: Record<string, number> = {
		raise: 3, call: 2, fold: 1,
	}
	const entries = Object.entries(handActions)
	entries.sort((a, b) => {
		const freqDiff = b[1] - a[1]
		if (freqDiff != 0) return freqDiff
		return (actionPriority[b[0]] ?? 0) -
			(actionPriority[a[0]] ?? 0)
	})

	const [action, frequency] = entries[0]

	// Build alternatives (any action that isn't the primary)
	const alternatives = entries
		.slice(1)
		.filter(([, freq]) => freq > 0)
		.map(([act, freq]) => ({ action: act, frequency: freq }))

	return {
		action,
		frequency,
		alternatives: alternatives.length > 0
			? alternatives
			: undefined,
	}
}
