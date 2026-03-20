/**
 * GTO Lookup Service — queries preflop ranges and push/fold charts.
 *
 * Provides the data layer for Claude's tool calls.
 * Never generates numbers — only returns curated data from the DB.
 */

import { db } from '../db/client'
import { preflopRanges, pushFoldCharts } from '../db/schema'
import { eq, and, type SQL } from 'drizzle-orm'

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

const PREFLOP_STACK_DEPTHS = [
	10, 15, 20, 25, 30, 40, 50, 75, 100,
]
const PUSH_FOLD_STACK_DEPTHS = [5, 8, 10, 15, 20]

const ACTION_PRIORITY: Record<string, number> = {
	raise: 3, call: 2, fold: 1,
}

export function findNearestDepth(
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

async function queryOne<T>(
	table: typeof preflopRanges | typeof pushFoldCharts,
	conditions: SQL[]
): Promise<T | null> {
	const rows = await db
		.select()
		.from(table)
		.where(and(...conditions))
		.limit(1)
	return rows.length > 0 ? (rows[0].ranges as T) : null
}

export async function lookupPreflopRange(
	position: string,
	scenario: string,
	stackDepthBb: number,
	tableSize: string
): Promise<PreflopRangeResult | null> {
	const conditions = (depth: number) => [
		eq(preflopRanges.position, position),
		eq(preflopRanges.scenario, scenario),
		eq(preflopRanges.stackDepthBb, depth),
		eq(preflopRanges.tableSize, tableSize),
	]

	const exact = await queryOne<RangeTable>(
		preflopRanges, conditions(stackDepthBb)
	)
	if (exact) {
		return { ranges: exact, confidence: 'high', matchType: 'exact' }
	}

	// Nearest bucket — if same as input, no data exists
	const nearest = findNearestDepth(
		stackDepthBb, PREFLOP_STACK_DEPTHS
	)
	if (nearest == stackDepthBb) return null

	const interpolated = await queryOne<RangeTable>(
		preflopRanges, conditions(nearest)
	)
	if (interpolated) {
		return {
			ranges: interpolated,
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
	const conditions = (depth: number) => [
		eq(pushFoldCharts.position, position),
		eq(pushFoldCharts.stackDepthBb, depth),
		eq(pushFoldCharts.tableSize, tableSize),
	]

	const exact = await queryOne<PushFoldRanges>(
		pushFoldCharts, conditions(stackDepthBb)
	)
	if (exact) {
		return { ranges: exact, confidence: 'high' }
	}

	const nearest = findNearestDepth(
		stackDepthBb, PUSH_FOLD_STACK_DEPTHS
	)
	if (nearest == stackDepthBb) return null

	const interpolated = await queryOne<PushFoldRanges>(
		pushFoldCharts, conditions(nearest)
	)
	if (interpolated) {
		return { ranges: interpolated, confidence: 'medium' }
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

	// Sort by frequency, tiebreak: raise > call > fold
	const entries = Object.entries(handActions)
	entries.sort((a, b) => {
		const freqDiff = b[1] - a[1]
		if (freqDiff != 0) return freqDiff
		return (ACTION_PRIORITY[b[0]] ?? 0) -
			(ACTION_PRIORITY[a[0]] ?? 0)
	})

	const [action, frequency] = entries[0]
	const alternatives = entries
		.slice(1)
		.filter(([, freq]) => freq > 0)
		.map(([act, freq]) => ({
			action: act, frequency: freq,
		}))

	return {
		action,
		frequency,
		alternatives: alternatives.length > 0
			? alternatives
			: undefined,
	}
}
