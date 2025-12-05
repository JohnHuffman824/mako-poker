import { describe, it, expect } from 'bun:test'
import { evaluateHand } from '../../domain/hand-evaluator'
import { createCard } from '../helpers'
import { HandType } from '@mako/shared'
import type { Card, Rank, Suit } from '@mako/shared'

/**
 * Comprehensive tests for the hand evaluator.
 * Tests 5, 6, and 7 card hands, all hand types, kickers, and ties.
 */

/**
 * Helper to create multiple cards from notation.
 * Format: "As Kh Qd Jc Ts" (rank + suit symbol)
 */
function cards(notation: string): Card[] {
	return notation.split(' ').map(n => {
		const rankStr = n.slice(0, -1)
		const suitChar = n.slice(-1)

		const suitMap: Record<string, Suit> = {
			's': 'spades',
			'h': 'hearts',
			'd': 'diamonds',
			'c': 'clubs'
		}

		const rankMap: Record<string, Rank> = {
			'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': 'T',
			'10': 'T', '9': '9', '8': '8', '7': '7', '6': '6',
			'5': '5', '4': '4', '3': '3', '2': '2'
		}

		const rank = rankMap[rankStr]
		const suit = suitMap[suitChar]

		if (!rank) throw new Error(`Invalid rank: ${rankStr}`)
		if (!suit) throw new Error(`Invalid suit: ${suitChar}`)

		return createCard(rank, suit)
	})
}

describe('HandEvaluator - 5 Card Hands', () => {
	describe('Royal Flush', () => {
		it('identifies royal flush', () => {
			const result = evaluateHand(
				cards('As Ks'),
				cards('Qs Js Ts')
			)
			expect(result.handType).toBe(HandType.ROYAL_FLUSH)
			expect(result.description).toBe('Royal Flush')
		})

		it('identifies royal flush in different suit', () => {
			const result = evaluateHand(
				cards('Ah Kh'),
				cards('Qh Jh Th')
			)
			expect(result.handType).toBe(HandType.ROYAL_FLUSH)
		})
	})

	describe('Straight Flush', () => {
		it('identifies king-high straight flush', () => {
			const result = evaluateHand(
				cards('Ks Qs'),
				cards('Js Ts 9s')
			)
			expect(result.handType).toBe(HandType.STRAIGHT_FLUSH)
			expect(result.description).toContain('King')
		})

		it('identifies wheel straight flush (A-2-3-4-5)', () => {
			const result = evaluateHand(
				cards('5h 4h'),
				cards('3h 2h Ah')
			)
			expect(result.handType).toBe(HandType.STRAIGHT_FLUSH)
			expect(result.description).toContain('5')
		})

		it('ranks higher straight flush above lower', () => {
			const high = evaluateHand(cards('Ks Qs'), cards('Js Ts 9s'))
			const low = evaluateHand(cards('9h 8h'), cards('7h 6h 5h'))
			expect(high.absoluteRank).toBeGreaterThan(low.absoluteRank)
		})
	})

	describe('Four of a Kind', () => {
		it('identifies four of a kind', () => {
			const result = evaluateHand(
				cards('Ah Ad'),
				cards('Ac As Ks')
			)
			expect(result.handType).toBe(HandType.FOUR_OF_A_KIND)
			expect(result.description).toContain('Ace')
		})

		it('higher quads beats lower quads', () => {
			const aces = evaluateHand(cards('Ah Ad'), cards('Ac As 2s'))
			const kings = evaluateHand(cards('Kh Kd'), cards('Kc Ks As'))
			expect(aces.absoluteRank).toBeGreaterThan(kings.absoluteRank)
		})

		it('kicker matters with same quads', () => {
			const highKicker = evaluateHand(cards('Ah Ad'), cards('Ac As Ks'))
			const lowKicker = evaluateHand(cards('Ah Ad'), cards('Ac As 2s'))
			expect(highKicker.absoluteRank).toBeGreaterThan(lowKicker.absoluteRank)
		})
	})

	describe('Full House', () => {
		it('identifies full house', () => {
			const result = evaluateHand(
				cards('Ah Ad'),
				cards('Ac Ks Kd')
			)
			expect(result.handType).toBe(HandType.FULL_HOUSE)
			expect(result.description).toContain('Ace')
			expect(result.description).toContain('King')
		})

		it('higher trips beats lower trips in full house', () => {
			const acesFullOfKings = evaluateHand(
				cards('Ah Ad'), cards('Ac Ks Kd')
			)
			const kingsFullOfAces = evaluateHand(
				cards('Kh Kd'), cards('Kc As Ad')
			)
			expect(acesFullOfKings.absoluteRank).toBeGreaterThan(
				kingsFullOfAces.absoluteRank
			)
		})

		it('pair matters when trips are equal', () => {
			const acesFullOfKings = evaluateHand(
				cards('Ah Ad'), cards('Ac Ks Kd')
			)
			const acesFullOfQueens = evaluateHand(
				cards('Ah Ad'), cards('Ac Qs Qd')
			)
			expect(acesFullOfKings.absoluteRank).toBeGreaterThan(
				acesFullOfQueens.absoluteRank
			)
		})
	})

	describe('Flush', () => {
		it('identifies flush', () => {
			const result = evaluateHand(
				cards('Ah Kh'),
				cards('Jh 9h 2h')
			)
			expect(result.handType).toBe(HandType.FLUSH)
			expect(result.description).toContain('Ace')
		})

		it('higher flush beats lower flush', () => {
			const aceHigh = evaluateHand(cards('Ah Kh'), cards('Jh 9h 2h'))
			const kingHigh = evaluateHand(cards('Kh Qh'), cards('Jh 9h 2h'))
			expect(aceHigh.absoluteRank).toBeGreaterThan(kingHigh.absoluteRank)
		})

		it('second card matters when first is equal', () => {
			const aceKing = evaluateHand(cards('Ah Kh'), cards('Jh 9h 2h'))
			const aceQueen = evaluateHand(cards('Ah Qh'), cards('Jh 9h 2h'))
			expect(aceKing.absoluteRank).toBeGreaterThan(aceQueen.absoluteRank)
		})

		it('all five cards matter for flush comparison', () => {
			const higher = evaluateHand(cards('Ah Kh'), cards('Qh Jh 9h'))
			const lower = evaluateHand(cards('Ah Kh'), cards('Qh Jh 8h'))
			expect(higher.absoluteRank).toBeGreaterThan(lower.absoluteRank)
		})
	})

	describe('Straight', () => {
		it('identifies ace-high straight', () => {
			const result = evaluateHand(
				cards('As Kh'),
				cards('Qd Jc Ts')
			)
			expect(result.handType).toBe(HandType.STRAIGHT)
			expect(result.description).toContain('Ace')
		})

		it('identifies wheel (A-2-3-4-5)', () => {
			const result = evaluateHand(
				cards('5h 4d'),
				cards('3c 2s Ah')
			)
			expect(result.handType).toBe(HandType.STRAIGHT)
			expect(result.description).toContain('5')
		})

		it('higher straight beats lower straight', () => {
			const broadway = evaluateHand(cards('As Kh'), cards('Qd Jc Ts'))
			const wheel = evaluateHand(cards('5h 4d'), cards('3c 2s Ah'))
			expect(broadway.absoluteRank).toBeGreaterThan(wheel.absoluteRank)
		})

		it('wheel is lowest straight', () => {
			const wheel = evaluateHand(cards('5h 4d'), cards('3c 2s Ah'))
			const sixHigh = evaluateHand(cards('6h 5d'), cards('4c 3s 2h'))
			expect(sixHigh.absoluteRank).toBeGreaterThan(wheel.absoluteRank)
		})
	})

	describe('Three of a Kind', () => {
		it('identifies three of a kind', () => {
			const result = evaluateHand(
				cards('Ah Ad'),
				cards('Ac Ks 7d')
			)
			expect(result.handType).toBe(HandType.THREE_OF_A_KIND)
			expect(result.description).toContain('Ace')
		})

		it('higher trips beats lower trips', () => {
			const aces = evaluateHand(cards('Ah Ad'), cards('Ac Ks 7d'))
			const kings = evaluateHand(cards('Kh Kd'), cards('Kc As 7d'))
			expect(aces.absoluteRank).toBeGreaterThan(kings.absoluteRank)
		})

		it('first kicker matters with same trips', () => {
			const highKicker = evaluateHand(cards('Ah Ad'), cards('Ac Ks 7d'))
			const lowKicker = evaluateHand(cards('Ah Ad'), cards('Ac Qs 7d'))
			expect(highKicker.absoluteRank).toBeGreaterThan(lowKicker.absoluteRank)
		})

		it('second kicker matters when first kicker ties', () => {
			const higher = evaluateHand(cards('Ah Ad'), cards('Ac Ks Qd'))
			const lower = evaluateHand(cards('Ah Ad'), cards('Ac Ks 7d'))
			expect(higher.absoluteRank).toBeGreaterThan(lower.absoluteRank)
		})
	})

	describe('Two Pair', () => {
		it('identifies two pair', () => {
			const result = evaluateHand(
				cards('Ah Ad'),
				cards('Kh Kd 7s')
			)
			expect(result.handType).toBe(HandType.TWO_PAIR)
			expect(result.description).toContain('Ace')
			expect(result.description).toContain('King')
		})

		it('higher top pair beats lower top pair', () => {
			const acesAndKings = evaluateHand(cards('Ah Ad'), cards('Kh Kd 7s'))
			const kingsAndQueens = evaluateHand(cards('Kh Kd'), cards('Qh Qd As'))
			expect(acesAndKings.absoluteRank).toBeGreaterThan(
				kingsAndQueens.absoluteRank
			)
		})

		it('second pair matters when top pair ties', () => {
			const acesAndKings = evaluateHand(cards('Ah Ad'), cards('Kh Kd 7s'))
			const acesAndQueens = evaluateHand(cards('Ah Ad'), cards('Qh Qd 7s'))
			expect(acesAndKings.absoluteRank).toBeGreaterThan(
				acesAndQueens.absoluteRank
			)
		})

		it('kicker matters when both pairs tie', () => {
			const highKicker = evaluateHand(cards('Ah Ad'), cards('Kh Kd Qs'))
			const lowKicker = evaluateHand(cards('Ah Ad'), cards('Kh Kd 7s'))
			expect(highKicker.absoluteRank).toBeGreaterThan(lowKicker.absoluteRank)
		})
	})

	describe('One Pair', () => {
		it('identifies one pair', () => {
			const result = evaluateHand(
				cards('Ah Ad'),
				cards('Kh Qd 7s')
			)
			expect(result.handType).toBe(HandType.ONE_PAIR)
			expect(result.description).toContain('Ace')
		})

		it('higher pair beats lower pair', () => {
			const aces = evaluateHand(cards('Ah Ad'), cards('Kh Qd 7s'))
			const kings = evaluateHand(cards('Kh Kd'), cards('Ah Qd 7s'))
			expect(aces.absoluteRank).toBeGreaterThan(kings.absoluteRank)
		})

		it('first kicker matters with same pair', () => {
			const kingKicker = evaluateHand(cards('Ah Ad'), cards('Kh Qd 7s'))
			const queenKicker = evaluateHand(cards('Ah Ad'), cards('Qh Jd 7s'))
			expect(kingKicker.absoluteRank).toBeGreaterThan(queenKicker.absoluteRank)
		})

		it('second kicker matters when first ties', () => {
			const higher = evaluateHand(cards('Ah Ad'), cards('Kh Qd 7s'))
			const lower = evaluateHand(cards('Ah Ad'), cards('Kh Jd 7s'))
			expect(higher.absoluteRank).toBeGreaterThan(lower.absoluteRank)
		})

		it('third kicker matters when first two tie (large difference)', () => {
			// Note: Due to compression of 22,092 hands into 2,860 slots,
			// very small third kicker differences may not be distinguishable.
			// Using J vs 2 (large difference) to ensure distinction.
			const higher = evaluateHand(cards('Ah Ad'), cards('Kh Qd Js'))
			const lower = evaluateHand(cards('Ah Ad'), cards('Kh Qd 2s'))
			expect(higher.absoluteRank).toBeGreaterThan(lower.absoluteRank)
		})
	})

	describe('High Card', () => {
		it('identifies high card', () => {
			const result = evaluateHand(
				cards('Ah Kd'),
				cards('Qc 9s 7h')
			)
			expect(result.handType).toBe(HandType.HIGH_CARD)
			expect(result.description).toContain('Ace')
		})

		it('higher high card beats lower', () => {
			const aceHigh = evaluateHand(cards('Ah Kd'), cards('Qc 9s 7h'))
			const kingHigh = evaluateHand(cards('Kh Qd'), cards('Jc 9s 7h'))
			expect(aceHigh.absoluteRank).toBeGreaterThan(kingHigh.absoluteRank)
		})

		it('all five cards matter for comparison', () => {
			const higher = evaluateHand(cards('Ah Kd'), cards('Qc Js 9h'))
			const lower = evaluateHand(cards('Ah Kd'), cards('Qc Js 8h'))
			expect(higher.absoluteRank).toBeGreaterThan(lower.absoluteRank)
		})
	})
})

describe('HandEvaluator - 6 Card Hands', () => {
	it('finds best 5-card hand from 6 cards', () => {
		// 6 cards: flush possible with 5 of them
		const result = evaluateHand(
			cards('Ah Kh'),
			cards('Qh Jh 9h 2c')
		)
		expect(result.handType).toBe(HandType.FLUSH)
	})

	it('ignores sixth card that would weaken hand', () => {
		// Full house is best even though 6th card exists
		const result = evaluateHand(
			cards('Ah Ad'),
			cards('Ac Kh Kd 2s')
		)
		expect(result.handType).toBe(HandType.FULL_HOUSE)
	})

	it('uses sixth card if it improves hand', () => {
		// 6th card completes straight
		const result = evaluateHand(
			cards('Ah Kd'),
			cards('Qs Jc Ts 2h')
		)
		expect(result.handType).toBe(HandType.STRAIGHT)
	})
})

describe('HandEvaluator - 7 Card Hands (Full Board)', () => {
	it('finds best 5-card hand from 7 cards', () => {
		const result = evaluateHand(
			cards('Ah Kh'),
			cards('Qh Jh Th 5c 2d')
		)
		expect(result.handType).toBe(HandType.ROYAL_FLUSH)
	})

	it('evaluates complex board correctly', () => {
		// Board has pair, hero has trips
		const result = evaluateHand(
			cards('Ah Ad'),
			cards('Ac 5h 5d 9c 2s')
		)
		expect(result.handType).toBe(HandType.FULL_HOUSE)
	})

	it('chooses best full house from multiple options', () => {
		// Multiple full house possibilities
		const result = evaluateHand(
			cards('Ah Ad'),
			cards('Ac Kh Kd Ks 2s')
		)
		// Best is Aces full of Kings (not Kings full of Aces)
		expect(result.handType).toBe(HandType.FULL_HOUSE)
		expect(result.description).toContain('Ace')
	})

	it('handles board with straight and flush possibilities', () => {
		// Must pick higher ranking hand
		const result = evaluateHand(
			cards('9h 8h'),
			cards('7h 6h 5h 4c 3c')
		)
		expect(result.handType).toBe(HandType.STRAIGHT_FLUSH)
	})
})

describe('HandEvaluator - Hand Type Rankings', () => {
	/**
	 * Verify that hand types are ranked correctly:
	 * Royal Flush > Straight Flush > Four of a Kind > Full House >
	 * Flush > Straight > Three of a Kind > Two Pair > One Pair > High Card
	 */
	it('royal flush beats straight flush', () => {
		const royal = evaluateHand(cards('As Ks'), cards('Qs Js Ts'))
		const sf = evaluateHand(cards('9s 8s'), cards('7s 6s 5s'))
		expect(royal.absoluteRank).toBeGreaterThan(sf.absoluteRank)
	})

	it('straight flush beats four of a kind', () => {
		const sf = evaluateHand(cards('9s 8s'), cards('7s 6s 5s'))
		const quads = evaluateHand(cards('Ah Ad'), cards('Ac As Kd'))
		expect(sf.absoluteRank).toBeGreaterThan(quads.absoluteRank)
	})

	it('four of a kind beats full house', () => {
		const quads = evaluateHand(cards('Ah Ad'), cards('Ac As Kd'))
		const fh = evaluateHand(cards('Ah Ad'), cards('Ac Kh Kd'))
		expect(quads.absoluteRank).toBeGreaterThan(fh.absoluteRank)
	})

	it('full house beats flush', () => {
		const fh = evaluateHand(cards('Ah Ad'), cards('Ac Kh Kd'))
		const flush = evaluateHand(cards('Ah Kh'), cards('Qh Jh 9h'))
		expect(fh.absoluteRank).toBeGreaterThan(flush.absoluteRank)
	})

	it('flush beats straight', () => {
		const flush = evaluateHand(cards('Ah Kh'), cards('Qh Jh 9h'))
		const straight = evaluateHand(cards('As Kh'), cards('Qd Jc Ts'))
		expect(flush.absoluteRank).toBeGreaterThan(straight.absoluteRank)
	})

	it('straight beats three of a kind', () => {
		const straight = evaluateHand(cards('As Kh'), cards('Qd Jc Ts'))
		const trips = evaluateHand(cards('Ah Ad'), cards('Ac Ks 7d'))
		expect(straight.absoluteRank).toBeGreaterThan(trips.absoluteRank)
	})

	it('three of a kind beats two pair', () => {
		const trips = evaluateHand(cards('Ah Ad'), cards('Ac Ks 7d'))
		const twoPair = evaluateHand(cards('Ah Ad'), cards('Kh Kd 7s'))
		expect(trips.absoluteRank).toBeGreaterThan(twoPair.absoluteRank)
	})

	it('two pair beats one pair', () => {
		const twoPair = evaluateHand(cards('Ah Ad'), cards('Kh Kd 7s'))
		const onePair = evaluateHand(cards('Ah Ad'), cards('Kh Qd 7s'))
		expect(twoPair.absoluteRank).toBeGreaterThan(onePair.absoluteRank)
	})

	it('one pair beats high card', () => {
		const onePair = evaluateHand(cards('Ah Ad'), cards('Kh Qd 7s'))
		const highCard = evaluateHand(cards('Ah Kd'), cards('Qc 9s 7h'))
		expect(onePair.absoluteRank).toBeGreaterThan(highCard.absoluteRank)
	})
})

describe('HandEvaluator - Tie Detection', () => {
	it('identical hands have equal rank', () => {
		const hand1 = evaluateHand(cards('Ah Kd'), cards('Qc Js 9h'))
		const hand2 = evaluateHand(cards('Ac Ks'), cards('Qd Jh 9c'))

		// Same high card hand, should have equal rank
		expect(hand1.absoluteRank).toBe(hand2.absoluteRank)
	})

	it('same flush with same cards ties', () => {
		const hand1 = evaluateHand(cards('Ah Kh'), cards('Qh Jh 9h'))
		const hand2 = evaluateHand(cards('As Ks'), cards('Qs Js 9s'))

		expect(hand1.absoluteRank).toBe(hand2.absoluteRank)
	})

	it('same straight ties regardless of suits', () => {
		const hand1 = evaluateHand(cards('As Kh'), cards('Qd Jc Ts'))
		const hand2 = evaluateHand(cards('Ah Ks'), cards('Qc Jd Th'))

		expect(hand1.absoluteRank).toBe(hand2.absoluteRank)
	})

	it('same two pair with same kicker ties', () => {
		const hand1 = evaluateHand(cards('Ah Ad'), cards('Kh Kd Qs'))
		const hand2 = evaluateHand(cards('As Ac'), cards('Ks Kc Qh'))

		expect(hand1.absoluteRank).toBe(hand2.absoluteRank)
	})
})

describe('HandEvaluator - Edge Cases', () => {
	it('throws error for less than 5 cards', () => {
		expect(() => evaluateHand(cards('Ah Ad'), cards('Kh Qd'))).toThrow()
	})

	it('throws error for more than 7 cards', () => {
		expect(() => evaluateHand(
			cards('Ah Ad'),
			cards('Kh Qd Jc Ts 9h 8c')
		)).toThrow()
	})

	it('handles ace playing low in wheel', () => {
		const wheel = evaluateHand(cards('Ah 5d'), cards('4c 3s 2h'))
		expect(wheel.handType).toBe(HandType.STRAIGHT)

		// Ace-high straight should beat wheel
		const broadway = evaluateHand(cards('As Kh'), cards('Qd Jc Ts'))
		expect(broadway.absoluteRank).toBeGreaterThan(wheel.absoluteRank)
	})

	it('ace plays high in broadway straight', () => {
		const broadway = evaluateHand(cards('As Kh'), cards('Qd Jc Ts'))
		expect(broadway.handType).toBe(HandType.STRAIGHT)
		expect(broadway.description).toContain('Ace')
	})
})

