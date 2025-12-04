import { describe, it, expect } from 'bun:test'
import { evaluateHand } from '../../domain/hand-evaluator'
import { HandType } from '@mako/shared'
import { createTestCard } from '../helpers'

describe('HandEvaluator', () => {
	describe('evaluateHand', () => {
		it('identifies a royal flush', () => {
			const holeCards = [
				createTestCard('A', 'spades'),
				createTestCard('K', 'spades')
			]
			const communityCards = [
				createTestCard('Q', 'spades'),
				createTestCard('J', 'spades'),
				createTestCard('10', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.ROYAL_FLUSH)
			expect(result.description).toBe('Royal Flush')
		})

		it('identifies a straight flush', () => {
			const holeCards = [
				createTestCard('9', 'hearts'),
				createTestCard('8', 'hearts')
			]
			const communityCards = [
				createTestCard('7', 'hearts'),
				createTestCard('6', 'hearts'),
				createTestCard('5', 'hearts')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.STRAIGHT_FLUSH)
		})

		it('identifies four of a kind', () => {
			const holeCards = [
				createTestCard('A', 'spades'),
				createTestCard('A', 'hearts')
			]
			const communityCards = [
				createTestCard('A', 'diamonds'),
				createTestCard('A', 'clubs'),
				createTestCard('K', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FOUR_OF_A_KIND)
		})

		it('identifies a full house', () => {
			const holeCards = [
				createTestCard('K', 'spades'),
				createTestCard('K', 'hearts')
			]
			const communityCards = [
				createTestCard('K', 'diamonds'),
				createTestCard('Q', 'clubs'),
				createTestCard('Q', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FULL_HOUSE)
		})

		it('identifies a flush', () => {
			const holeCards = [
				createTestCard('A', 'clubs'),
				createTestCard('9', 'clubs')
			]
			const communityCards = [
				createTestCard('7', 'clubs'),
				createTestCard('4', 'clubs'),
				createTestCard('2', 'clubs')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FLUSH)
		})

		it('identifies a straight', () => {
			const holeCards = [
				createTestCard('10', 'spades'),
				createTestCard('9', 'hearts')
			]
			const communityCards = [
				createTestCard('8', 'diamonds'),
				createTestCard('7', 'clubs'),
				createTestCard('6', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.STRAIGHT)
		})

		it('identifies the wheel (A-2-3-4-5)', () => {
			const holeCards = [
				createTestCard('A', 'spades'),
				createTestCard('2', 'hearts')
			]
			const communityCards = [
				createTestCard('3', 'diamonds'),
				createTestCard('4', 'clubs'),
				createTestCard('5', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.STRAIGHT)
			expect(result.description).toContain('5')
		})

		it('identifies three of a kind', () => {
			const holeCards = [
				createTestCard('J', 'spades'),
				createTestCard('J', 'hearts')
			]
			const communityCards = [
				createTestCard('J', 'diamonds'),
				createTestCard('9', 'clubs'),
				createTestCard('2', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.THREE_OF_A_KIND)
		})

		it('identifies two pair', () => {
			const holeCards = [
				createTestCard('Q', 'spades'),
				createTestCard('Q', 'hearts')
			]
			const communityCards = [
				createTestCard('8', 'diamonds'),
				createTestCard('8', 'clubs'),
				createTestCard('3', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.TWO_PAIR)
		})

		it('identifies one pair', () => {
			const holeCards = [
				createTestCard('A', 'spades'),
				createTestCard('A', 'hearts')
			]
			const communityCards = [
				createTestCard('K', 'diamonds'),
				createTestCard('9', 'clubs'),
				createTestCard('3', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.ONE_PAIR)
		})

		it('identifies high card', () => {
			const holeCards = [
				createTestCard('A', 'spades'),
				createTestCard('K', 'hearts')
			]
			const communityCards = [
				createTestCard('9', 'diamonds'),
				createTestCard('7', 'clubs'),
				createTestCard('3', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.HIGH_CARD)
		})

		it('selects best hand from 7 cards', () => {
			const holeCards = [
				createTestCard('A', 'spades'),
				createTestCard('A', 'hearts')
			]
			const communityCards = [
				createTestCard('A', 'diamonds'),
				createTestCard('K', 'clubs'),
				createTestCard('K', 'spades'),
				createTestCard('Q', 'hearts'),
				createTestCard('2', 'clubs')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FULL_HOUSE)
		})
	})

	describe('hand ranking comparison', () => {
		it('ranks royal flush higher than straight flush', () => {
			const royal = evaluateHand(
				[createTestCard('A', 'spades'), createTestCard('K', 'spades')],
				[
					createTestCard('Q', 'spades'),
					createTestCard('J', 'spades'),
					createTestCard('10', 'spades')
				]
			)

			const straightFlush = evaluateHand(
				[createTestCard('9', 'hearts'), createTestCard('8', 'hearts')],
				[
					createTestCard('7', 'hearts'),
					createTestCard('6', 'hearts'),
					createTestCard('5', 'hearts')
				]
			)

			expect(royal.absoluteRank).toBeGreaterThan(straightFlush.absoluteRank)
		})

		it('ranks higher pair above lower pair', () => {
			const acePair = evaluateHand(
				[createTestCard('A', 'spades'), createTestCard('A', 'hearts')],
				[
					createTestCard('K', 'diamonds'),
					createTestCard('9', 'clubs'),
					createTestCard('3', 'spades')
				]
			)

			const kingPair = evaluateHand(
				[createTestCard('K', 'spades'), createTestCard('K', 'hearts')],
				[
					createTestCard('Q', 'diamonds'),
					createTestCard('9', 'clubs'),
					createTestCard('3', 'spades')
				]
			)

			expect(acePair.absoluteRank).toBeGreaterThan(kingPair.absoluteRank)
		})
	})
})
