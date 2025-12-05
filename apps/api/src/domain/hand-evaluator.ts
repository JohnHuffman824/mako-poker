import type { Card, HandResult } from '@mako/shared'
import { rankValue, HandType, HAND_TYPE_NAMES } from '@mako/shared'
import { HAND_TYPE_BASE_RANKS } from './hand-rankings'

/**
 * Evaluates poker hands using standard Texas Hold'em rules.
 * Returns absolute rankings from 1-7462 where higher is better.
 */

/**
 * Evaluates best 5-card hand from available cards.
 * Supports 5, 6, or 7 card inputs.
 */
export function evaluateHand(
	holeCards: Card[],
	communityCards: Card[]
): HandResult {
	const allCards = [...holeCards, ...communityCards]

	if (allCards.length < 5 || allCards.length > 7) {
		throw new Error(`Must have 5-7 cards, got ${allCards.length}`)
	}

	const combinations = generateCombinations(allCards, 5)
	let bestResult: HandResult | null = null

	for (const combo of combinations) {
		const result = evaluateFiveCards(combo)
		if (!bestResult || result.absoluteRank > bestResult.absoluteRank) {
			bestResult = result
		}
	}

	if (!bestResult) {
		throw new Error('No valid hand found')
	}

	return bestResult
}

/**
 * Creates a HandResult object with calculated absolute rank.
 */
function createHandResult(
	handType: HandType,
	rankWithinType: number,
	cards: Card[],
	description: string
): HandResult {
	return {
		absoluteRank: HAND_TYPE_BASE_RANKS[handType] + rankWithinType,
		handType,
		cards,
		description
	}
}

/**
 * Checks if the hand is a straight flush or royal flush.
 */
function checkStraightFlush(
	isFlush: boolean,
	isStraight: boolean,
	isWheel: boolean,
	values: number[],
	cards: Card[]
): HandResult | null {
	if (!isFlush || !isStraight) return null

	const highCard = isWheel ? 5 : values[4]
	const isRoyal = highCard == 14
	const rankWithinType = calculateStraightFlushRank(highCard)
	const handType = isRoyal ? HandType.ROYAL_FLUSH : HandType.STRAIGHT_FLUSH
	const description = isRoyal
		? 'Royal Flush'
		: `Straight Flush, ${rankToName(highCard)} high`

	return createHandResult(handType, rankWithinType, cards, description)
}

/**
 * Checks if the hand is four of a kind.
 */
function checkFourOfKind(
	valueCounts: Record<number, number>,
	values: number[],
	cards: Card[]
): HandResult | null {
	const fourOfKind = findCountValue(valueCounts, 4)
	if (fourOfKind == null) return null

	const kicker = values.find(v => v != fourOfKind)!
	const rankWithinType = calculateFourOfKindRank(fourOfKind, kicker)
	const description = `Four of a Kind, ${rankToName(fourOfKind)}s`

	return createHandResult(HandType.FOUR_OF_A_KIND, rankWithinType, cards, description)
}

/**
 * Checks if the hand is a full house.
 */
function checkFullHouse(
	threeOfKind: number | null,
	pair: number | null,
	cards: Card[]
): HandResult | null {
	if (threeOfKind == null || pair == null) return null

	const rankWithinType = calculateFullHouseRank(threeOfKind, pair)
	const description = `Full House, ${rankToName(threeOfKind)}s full of ${rankToName(pair)}s`

	return createHandResult(HandType.FULL_HOUSE, rankWithinType, cards, description)
}

/**
 * Checks if the hand is a flush.
 */
function checkFlush(
	isFlush: boolean,
	values: number[],
	cards: Card[]
): HandResult | null {
	if (!isFlush) return null

	const rankWithinType = calculateFlushRank(values)
	const description = `Flush, ${rankToName(values[4])} high`

	return createHandResult(HandType.FLUSH, rankWithinType, cards, description)
}

/**
 * Checks if the hand is a straight.
 */
function checkStraightHand(
	isStraight: boolean,
	isWheel: boolean,
	values: number[],
	cards: Card[]
): HandResult | null {
	if (!isStraight) return null

	const highCard = isWheel ? 5 : values[4]
	const rankWithinType = calculateStraightRank(highCard)
	const description = `Straight, ${rankToName(highCard)} high`

	return createHandResult(HandType.STRAIGHT, rankWithinType, cards, description)
}

/**
 * Checks if the hand is three of a kind.
 */
function checkThreeOfKind(
	threeOfKind: number | null,
	values: number[],
	cards: Card[]
): HandResult | null {
	if (threeOfKind == null) return null

	const kickers = values.filter(v => v != threeOfKind).sort((a, b) => b - a)
	const rankWithinType = calculateThreeOfKindRank(threeOfKind, kickers)
	const description = `Three of a Kind, ${rankToName(threeOfKind)}s`

	return createHandResult(HandType.THREE_OF_A_KIND, rankWithinType, cards, description)
}

/**
 * Checks if the hand is two pair.
 */
function checkTwoPair(
	pairs: number[],
	values: number[],
	cards: Card[]
): HandResult | null {
	if (pairs.length != 2) return null

	const kicker = values.find(v => !pairs.includes(v))!
	const rankWithinType = calculateTwoPairRank(pairs[0], pairs[1], kicker)
	const description = `Two Pair, ${rankToName(pairs[0])}s and ${rankToName(pairs[1])}s`

	return createHandResult(HandType.TWO_PAIR, rankWithinType, cards, description)
}

/**
 * Checks if the hand is one pair.
 */
function checkOnePair(
	pairs: number[],
	values: number[],
	cards: Card[]
): HandResult | null {
	if (pairs.length != 1) return null

	const kickers = values.filter(v => v != pairs[0]).sort((a, b) => b - a)
	const rankWithinType = calculateOnePairRank(pairs[0], kickers)
	const description = `Pair of ${rankToName(pairs[0])}s`

	return createHandResult(HandType.ONE_PAIR, rankWithinType, cards, description)
}

/**
 * Evaluates a specific 5-card hand.
 */
function evaluateFiveCards(cards: Card[]): HandResult {
	const values = cards.map(c => rankValue(c.rank)).sort((a, b) => a - b)
	const suits = cards.map(c => c.suit)
	const valueCounts = countValues(values)

	const isFlush = new Set(suits).size == 1
	const isStraight = checkStraight(values)
	const isWheel = arraysEqual(values, [2, 3, 4, 5, 14])

	const straightFlush = checkStraightFlush(isFlush, isStraight, isWheel, values, cards)
	if (straightFlush) return straightFlush

	const fourOfKind = checkFourOfKind(valueCounts, values, cards)
	if (fourOfKind) return fourOfKind

	const threeOfKind = findCountValue(valueCounts, 3)
	const pair = findCountValue(valueCounts, 2)

	const fullHouse = checkFullHouse(threeOfKind, pair, cards)
	if (fullHouse) return fullHouse

	const flush = checkFlush(isFlush, values, cards)
	if (flush) return flush

	const straight = checkStraightHand(isStraight, isWheel, values, cards)
	if (straight) return straight

	const threeOfKindResult = checkThreeOfKind(threeOfKind, values, cards)
	if (threeOfKindResult) return threeOfKindResult

	const pairs = Object.entries(valueCounts)
		.filter(([, count]) => count == 2)
		.map(([val]) => parseInt(val))
		.sort((a, b) => b - a)

	const twoPair = checkTwoPair(pairs, values, cards)
	if (twoPair) return twoPair

	const onePair = checkOnePair(pairs, values, cards)
	if (onePair) return onePair

	const rankWithinType = calculateHighCardRank(values)
	return createHandResult(HandType.HIGH_CARD, rankWithinType, cards, `High Card, ${rankToName(values[4])}`)
}

/**
 * Checks if 5 cards form a straight.
 */
function checkStraight(values: number[]): boolean {
	const sorted = [...values].sort((a, b) => a - b)

	const isNormalStraight = sorted[4] - sorted[0] == 4 && new Set(sorted).size == 5
	const isWheel = arraysEqual(sorted, [2, 3, 4, 5, 14])

	return isNormalStraight || isWheel
}

/**
 * Counts occurrences of each value.
 */
function countValues(values: number[]): Record<number, number> {
	const counts: Record<number, number> = {}
	for (const v of values) {
		counts[v] = (counts[v] ?? 0) + 1
	}
	return counts
}

/**
 * Finds value with specific count.
 */
function findCountValue(
	counts: Record<number, number>,
	targetCount: number
): number | null {
	for (const [val, count] of Object.entries(counts)) {
		if (count === targetCount) {
			return parseInt(val)
		}
	}
	return null
}

/**
 * Compares two sorted arrays for equality.
 */
function arraysEqual(a: number[], b: number[]): boolean {
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false
	}
	return true
}

/**
 * Encodes a list of card values into a single comparable number.
 * Uses base-15 encoding to ensure each position is distinct.
 */
function encodeCardValues(values: number[]): number {
	let encoded = 0
	for (let i = 0; i < values.length; i++) {
		const power = values.length - 1 - i
		encoded += values[i] * Math.pow(15, power)
	}
	return encoded
}

/**
 * Normalizes an encoded value to fit within a rank range.
 */
function normalizeToRange(
	encoded: number,
	minPossible: number,
	maxPossible: number,
	targetMin: number,
	targetMax: number
): number {
	if (maxPossible === minPossible) return targetMin

	const proportion = (encoded - minPossible) / (maxPossible - minPossible)
	const rangeSize = targetMax - targetMin

	return targetMin + Math.floor(proportion * rangeSize)
}

/**
 * Common helper for calculating rank within a hand type using encode-normalize pattern.
 * Encodes the given values, then normalizes them to the target rank range.
 *
 * @param values - Card values to encode (should be pre-sorted as needed)
 * @param minValues - Minimum possible values for this hand type
 * @param maxValues - Maximum possible values for this hand type
 * @param targetMin - Minimum rank within hand type
 * @param targetMax - Maximum rank within hand type
 */
function calculateRankByEncoding(
	values: number[],
	minValues: number[],
	maxValues: number[],
	targetMin: number,
	targetMax: number
): number {
	const encoded = encodeCardValues(values)
	const minEncoded = encodeCardValues(minValues)
	const maxEncoded = encodeCardValues(maxValues)
	return normalizeToRange(encoded, minEncoded, maxEncoded, targetMin, targetMax)
}

/**
 * Common helper for straight-type hands (straight and straight flush).
 * Returns rank based on high card, with special handling for wheel (A-2-3-4-5).
 */
function calculateStraightTypeRank(highCard: number): number {
	if (highCard < 5 || highCard > 14) {
		throw new Error(`Invalid straight high card: ${highCard}`)
	}
	return highCard == 5 ? 1 : (highCard - 4)
}

function calculateHighCardRank(values: number[]): number {
	const sorted = [...values].sort((a, b) => b - a)
	return calculateRankByEncoding(sorted, [7, 5, 4, 3, 2], [14, 13, 12, 11, 9], 1, 1277)
}

function calculateOnePairRank(pairValue: number, kickers: number[]): number {
	const sortedKickers = kickers.slice(0, 3).sort((a, b) => b - a)

	// Use a wider range to preserve third kicker distinction
	// The range (2860) is multiplied by 10 internally, then divided back
	// This gives us fractional precision for the third kicker
	const encoded =
		(pairValue - 2) * 1690 +      // 169 * 10 per pair value
		(sortedKickers[0] - 2) * 130 + // 13 * 10 per first kicker
		(sortedKickers[1] - 2) * 10 +  // 1 * 10 per second kicker
		(sortedKickers[2] - 2)         // 1 per third kicker

	// Max encoded value: 12*1690 + 12*130 + 12*10 + 12 = 22,092
	// Scale to 1-2860 range
	const scaled = Math.floor(encoded * 2859 / 22092) + 1

	return Math.max(1, Math.min(2860, scaled))
}

function calculateTwoPairRank(
	highPair: number,
	lowPair: number,
	kicker: number
): number {
	return calculateRankByEncoding(
		[highPair, lowPair, kicker],
		[3, 2, 4],
		[14, 13, 12],
		1,
		858
	)
}

function calculateThreeOfKindRank(
	tripsValue: number,
	kickers: number[]
): number {
	const values = [tripsValue, ...kickers.slice(0, 2).sort((a, b) => b - a)]
	return calculateRankByEncoding(values, [2, 5, 4], [14, 13, 12], 1, 858)
}

function calculateStraightRank(highCard: number): number {
	return calculateStraightTypeRank(highCard)
}

function calculateFlushRank(values: number[]): number {
	const sorted = [...values].sort((a, b) => b - a)
	return calculateRankByEncoding(sorted, [7, 5, 4, 3, 2], [14, 13, 12, 11, 9], 1, 1277)
}

function calculateFullHouseRank(trips: number, pair: number): number {
	return calculateRankByEncoding([trips, pair], [2, 3], [14, 13], 1, 156)
}

function calculateFourOfKindRank(quads: number, kicker: number): number {
	return calculateRankByEncoding([quads, kicker], [2, 3], [14, 13], 1, 156)
}

function calculateStraightFlushRank(highCard: number): number {
	return calculateStraightTypeRank(highCard)
}

/**
 * Converts numeric rank value to display name.
 */
function rankToName(value: number): string {
	switch (value) {
		case 14: return 'Ace'
		case 13: return 'King'
		case 12: return 'Queen'
		case 11: return 'Jack'
		case 10: return 'Ten'
		default: return value.toString()
	}
}

/**
 * Generates all k-combinations from array.
 */
function generateCombinations<T>(array: T[], k: number): T[][] {
	if (k === 0) return [[]]
	if (array.length === 0) return []

	const [head, ...tail] = array

	const withHead = generateCombinations(tail, k - 1)
		.map(combo => [head, ...combo])
	const withoutHead = generateCombinations(tail, k)

	return [...withHead, ...withoutHead]
}

/**
 * Formats a hand result as a display string.
 */
export function formatHandResult(result: HandResult): string {
	return `${HAND_TYPE_NAMES[result.handType]} (${result.description})`
}

