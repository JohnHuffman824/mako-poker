import { describe, it, expect } from 'bun:test'
import { getPreflopBucket, getPostflopBucket, getBucket } from './hand-bucketing'
import type { Card } from '@mako/shared'

describe('Hand Bucketing', () => {
	describe('getPreflopBucket', () => {
		it('should bucket pocket aces as highest pair bucket', () => {
			const cards: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'A', suit: 'hearts' }
			]
			const bucket = getPreflopBucket(cards)
			expect(bucket).toBe(12)  // AA = bucket 12 (0-indexed)
		})

		it('should bucket pocket twos as lowest pair bucket', () => {
			const cards: Card[] = [
				{ rank: '2', suit: 'spades' },
				{ rank: '2', suit: 'hearts' }
			]
			const bucket = getPreflopBucket(cards)
			expect(bucket).toBe(0)  // 22 = bucket 0
		})

		it('should bucket AKs as suited hand', () => {
			const cards: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'K', suit: 'spades' }
			]
			const bucket = getPreflopBucket(cards)
			// Suited hands start at bucket 13
			expect(bucket).toBeGreaterThanOrEqual(13)
			expect(bucket).toBeLessThan(91)  // Before offsuit hands
		})

		it('should bucket AKo as offsuit hand', () => {
			const cards: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'K', suit: 'hearts' }
			]
			const bucket = getPreflopBucket(cards)
			// Offsuit hands start at bucket 91
			expect(bucket).toBeGreaterThanOrEqual(91)
			expect(bucket).toBeLessThan(169)
		})

		it('should produce same bucket regardless of card order', () => {
			const cards1: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'K', suit: 'spades' }
			]
			const cards2: Card[] = [
				{ rank: 'K', suit: 'spades' },
				{ rank: 'A', suit: 'spades' }
			]
			expect(getPreflopBucket(cards1)).toBe(getPreflopBucket(cards2))
		})

		it('should throw for invalid number of cards', () => {
			const cards: Card[] = [
				{ rank: 'A', suit: 'spades' }
			]
			expect(() => getPreflopBucket(cards)).toThrow('Must have exactly 2 hole cards')
		})

		it('should produce 169 unique buckets', () => {
			const buckets = new Set<number>()
			const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
			const suits = ['spades', 'hearts'] as const

			// Generate all unique starting hands
			for (let i = 0; i < ranks.length; i++) {
				for (let j = i; j < ranks.length; j++) {
					if (i === j) {
						// Pair
						const cards: Card[] = [
							{ rank: ranks[i], suit: 'spades' },
							{ rank: ranks[j], suit: 'hearts' }
						]
						buckets.add(getPreflopBucket(cards))
					} else {
						// Suited
						const suitedCards: Card[] = [
							{ rank: ranks[i], suit: 'spades' },
							{ rank: ranks[j], suit: 'spades' }
						]
						buckets.add(getPreflopBucket(suitedCards))

						// Offsuit
						const offsuitCards: Card[] = [
							{ rank: ranks[i], suit: 'spades' },
							{ rank: ranks[j], suit: 'hearts' }
						]
						buckets.add(getPreflopBucket(offsuitCards))
					}
				}
			}

			expect(buckets.size).toBe(169)
		})
	})

	describe('getPostflopBucket', () => {
		it('should return higher bucket for stronger hands', () => {
			const holeCards: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'A', suit: 'hearts' }
			]
			const weakBoard: Card[] = [
				{ rank: '2', suit: 'clubs' },
				{ rank: '3', suit: 'diamonds' },
				{ rank: '4', suit: 'clubs' }
			]
			const bucket = getPostflopBucket(holeCards, weakBoard)
			// Pair of aces should be in upper half
			expect(bucket).toBeGreaterThan(5)
		})
	})

	describe('getBucket', () => {
		it('should use preflop bucketing when no community cards', () => {
			const cards: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'A', suit: 'hearts' }
			]
			const bucket = getBucket(cards, [])
			expect(bucket).toBe(getPreflopBucket(cards))
		})

		it('should use postflop bucketing with community cards', () => {
			const holeCards: Card[] = [
				{ rank: 'A', suit: 'spades' },
				{ rank: 'K', suit: 'spades' }
			]
			const communityCards: Card[] = [
				{ rank: 'Q', suit: 'hearts' },
				{ rank: 'J', suit: 'clubs' },
				{ rank: 'T', suit: 'diamonds' }
			]
			const bucket = getBucket(holeCards, communityCards)
			expect(bucket).toBe(getPostflopBucket(holeCards, communityCards))
		})
	})
})


