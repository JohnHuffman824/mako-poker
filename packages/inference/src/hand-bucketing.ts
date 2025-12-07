/**
 * Hand bucketing for feature extraction.
 *
 * Maps hole cards to bucket indices for model input.
 * Mirrors the Python HandBucketing implementation.
 */

import type { Card } from '@mako/shared'
import { rankValue } from '@mako/shared'

/**
 * Maps hole cards to a preflop bucket index (0-168).
 *
 * Uses the standard 169 starting hand categories:
 * - Pairs: 13 buckets (22-AA)
 * - Suited hands: 78 buckets (32s-AKs)
 * - Offsuit hands: 78 buckets (32o-AKo)
 */
export function getPreflopBucket(holeCards: Card[]): number {
	if (holeCards.length !== 2) {
		throw new Error('Must have exactly 2 hole cards')
	}

	const [card1, card2] = holeCards
	const rank1 = rankValue(card1.rank)
	const rank2 = rankValue(card2.rank)
	const suited = card1.suit === card2.suit

	// Normalize so higher rank comes first
	const highRank = Math.max(rank1, rank2)
	const lowRank = Math.min(rank1, rank2)

	// Pair
	if (highRank === lowRank) {
		return highRank - 2  // 0-12 (22=0, AA=12)
	}

	// Convert to 0-indexed (2=0, A=12)
	const high = highRank - 2
	const low = lowRank - 2

	if (suited) {
		// Suited hands: 13 + index into upper triangle
		// AKs, AQs, ... 32s
		return 13 + getTriangleIndex(high, low)
	}

	// Offsuit hands: 13 + 78 + index into upper triangle
	return 91 + getTriangleIndex(high, low)
}

/**
 * Get index into upper triangle of 13x13 matrix.
 * Used for non-pair hands.
 */
function getTriangleIndex(high: number, low: number): number {
	// Number of elements before row 'high' in upper triangle
	// Sum from 0 to (high-1) = high*(high-1)/2... but we want
	// elements where first index < high
	let index = 0
	for (let h = 1; h < high; h++) {
		index += h  // h possible low values for each high
	}
	return index + low
}

/**
 * Maps hole cards + board to a postflop bucket.
 *
 * Simplified bucketing based on made hand strength.
 * For more accurate bucketing, use equity calculations.
 */
export function getPostflopBucket(
	holeCards: Card[],
	communityCards: Card[],
	numBuckets: number = 20
): number {
	// Placeholder - would need hand evaluator integration
	// For now, use simple heuristics based on card ranks
	const allCards = [...holeCards, ...communityCards]
	const ranks = allCards.map(c => rankValue(c.rank))

	// Check for pairs, high cards, etc.
	const rankCounts = new Map<number, number>()
	for (const r of ranks) {
		rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1)
	}

	const maxCount = Math.max(...rankCounts.values())
	const highCard = Math.max(...ranks)

	// Very simple bucketing
	if (maxCount >= 4) return numBuckets - 1  // Quads
	if (maxCount === 3) return Math.floor(numBuckets * 0.8)  // Trips
	if (maxCount === 2) return Math.floor(numBuckets * 0.5)  // Pair
	return Math.floor((highCard - 2) / 13 * numBuckets * 0.4)  // High card
}

/**
 * Get bucket for model input.
 * Uses preflop bucketing when no community cards,
 * otherwise uses postflop bucketing.
 */
export function getBucket(
	holeCards: Card[],
	communityCards: Card[] = []
): number {
	if (communityCards.length === 0) {
		return getPreflopBucket(holeCards)
	}
	return getPostflopBucket(holeCards, communityCards)
}


