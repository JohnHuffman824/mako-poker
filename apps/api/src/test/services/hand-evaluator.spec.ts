import { describe, it, expect } from 'bun:test'
import { evaluateHand } from '../../domain/hand-evaluator'
import { HandType } from '@mako/shared'
import { createCard } from '../helpers'

describe('HandEvaluator', () => {
	describe('evaluateHand', () => {
		it('identifies a royal flush', () => {
			const holeCards = [
				createCard('A', 'spades'),
				createCard('K', 'spades')
			]
			const communityCards = [
				createCard('Q', 'spades'),
				createCard('J', 'spades'),
				createCard('T', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.ROYAL_FLUSH)
			expect(result.description).toBe('Royal Flush')
		})

		it('identifies a straight flush', () => {
			const holeCards = [
				createCard('9', 'hearts'),
				createCard('8', 'hearts')
			]
			const communityCards = [
				createCard('7', 'hearts'),
				createCard('6', 'hearts'),
				createCard('5', 'hearts')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.STRAIGHT_FLUSH)
		})

		it('identifies four of a kind', () => {
			const holeCards = [
				createCard('A', 'spades'),
				createCard('A', 'hearts')
			]
			const communityCards = [
				createCard('A', 'diamonds'),
				createCard('A', 'clubs'),
				createCard('K', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FOUR_OF_A_KIND)
		})

		it('identifies a full house', () => {
			const holeCards = [
				createCard('K', 'spades'),
				createCard('K', 'hearts')
			]
			const communityCards = [
				createCard('K', 'diamonds'),
				createCard('Q', 'clubs'),
				createCard('Q', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FULL_HOUSE)
		})

		it('identifies a flush', () => {
			const holeCards = [
				createCard('A', 'clubs'),
				createCard('9', 'clubs')
			]
			const communityCards = [
				createCard('7', 'clubs'),
				createCard('4', 'clubs'),
				createCard('2', 'clubs')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FLUSH)
		})

		it('identifies a straight', () => {
			const holeCards = [
				createCard('T', 'spades'),
				createCard('9', 'hearts')
			]
			const communityCards = [
				createCard('8', 'diamonds'),
				createCard('7', 'clubs'),
				createCard('6', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.STRAIGHT)
		})

		it('identifies the wheel (A-2-3-4-5)', () => {
			const holeCards = [
				createCard('A', 'spades'),
				createCard('2', 'hearts')
			]
			const communityCards = [
				createCard('3', 'diamonds'),
				createCard('4', 'clubs'),
				createCard('5', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.STRAIGHT)
			expect(result.description).toContain('5')
		})

		it('identifies three of a kind', () => {
			const holeCards = [
				createCard('J', 'spades'),
				createCard('J', 'hearts')
			]
			const communityCards = [
				createCard('J', 'diamonds'),
				createCard('9', 'clubs'),
				createCard('2', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.THREE_OF_A_KIND)
		})

		it('identifies two pair', () => {
			const holeCards = [
				createCard('Q', 'spades'),
				createCard('Q', 'hearts')
			]
			const communityCards = [
				createCard('8', 'diamonds'),
				createCard('8', 'clubs'),
				createCard('3', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.TWO_PAIR)
		})

		it('identifies one pair', () => {
			const holeCards = [
				createCard('A', 'spades'),
				createCard('A', 'hearts')
			]
			const communityCards = [
				createCard('K', 'diamonds'),
				createCard('9', 'clubs'),
				createCard('3', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.ONE_PAIR)
		})

		it('identifies high card', () => {
			const holeCards = [
				createCard('A', 'spades'),
				createCard('K', 'hearts')
			]
			const communityCards = [
				createCard('9', 'diamonds'),
				createCard('7', 'clubs'),
				createCard('3', 'spades')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.HIGH_CARD)
		})

		it('selects best hand from 7 cards', () => {
			const holeCards = [
				createCard('A', 'spades'),
				createCard('A', 'hearts')
			]
			const communityCards = [
				createCard('A', 'diamonds'),
				createCard('K', 'clubs'),
				createCard('K', 'spades'),
				createCard('Q', 'hearts'),
				createCard('2', 'clubs')
			]

			const result = evaluateHand(holeCards, communityCards)

			expect(result.handType).toBe(HandType.FULL_HOUSE)
		})
	})

	describe('hand ranking comparison', () => {
		it('ranks royal flush higher than straight flush', () => {
			const royal = evaluateHand(
				[createCard('A', 'spades'), createCard('K', 'spades')],
				[
					createCard('Q', 'spades'),
					createCard('J', 'spades'),
					createCard('T', 'spades')
				]
			)

			const straightFlush = evaluateHand(
				[createCard('9', 'hearts'), createCard('8', 'hearts')],
				[
					createCard('7', 'hearts'),
					createCard('6', 'hearts'),
					createCard('5', 'hearts')
				]
			)

			expect(royal.absoluteRank).toBeGreaterThan(straightFlush.absoluteRank)
		})

		it('ranks higher pair above lower pair', () => {
			const acePair = evaluateHand(
				[createCard('A', 'spades'), createCard('A', 'hearts')],
				[
					createCard('K', 'diamonds'),
					createCard('9', 'clubs'),
					createCard('3', 'spades')
				]
			)

			const kingPair = evaluateHand(
				[createCard('K', 'spades'), createCard('K', 'hearts')],
				[
					createCard('Q', 'diamonds'),
					createCard('9', 'clubs'),
					createCard('3', 'spades')
				]
			)

			expect(acePair.absoluteRank).toBeGreaterThan(kingPair.absoluteRank)
		})
	})
})
