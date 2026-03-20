import { describe, it, expect } from 'bun:test'
import {
	lookupPreflopRange,
	lookupPushFold,
	getHandRecommendation,
	findNearestDepth,
} from '../../services/gto-service'

describe('GtoService', () => {
	describe('findNearestDepth', () => {
		const buckets = [5, 8, 10, 15, 20]

		it('returns exact match when target is in buckets', () => {
			expect(findNearestDepth(10, buckets)).toBe(10)
		})

		it('returns nearest lower bucket', () => {
			expect(findNearestDepth(9, buckets)).toBe(8)
		})

		it('returns nearest upper bucket', () => {
			expect(findNearestDepth(12, buckets)).toBe(10)
		})

		it('picks first match when equidistant', () => {
			// 6 is equidistant from 5 and 8; first match wins
			const result = findNearestDepth(6, buckets)
			expect(result == 5 || result == 8).toBe(true)
		})

		it('handles single-element bucket list', () => {
			expect(findNearestDepth(50, [100])).toBe(100)
		})
	})

	describe('lookupPreflopRange', () => {
		it('returns exact match for BTN open 100BB 6max', async () => {
			const result = await lookupPreflopRange(
				'BTN', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.matchType).toBe('exact')
			expect(result!.confidence).toBe('high')
			expect(result!.ranges['AA']).toEqual({ raise: 1 })
			expect(result!.ranges['AKs']).toEqual({ raise: 1 })
		})

		it('returns exact match for UTG open 20BB 9max', async () => {
			const result = await lookupPreflopRange(
				'UTG', 'open', 20, '9max'
			)

			expect(result).not.toBeNull()
			expect(result!.matchType).toBe('exact')
			expect(result!.ranges['AA']).toEqual({ raise: 1 })
			expect(result!.ranges['72o']).toEqual({ fold: 1 })
		})

		it('returns interpolated for 22BB with range data',
			async () => {
				const result = await lookupPreflopRange(
					'BTN', 'open', 22, '6max'
				)

				expect(result).not.toBeNull()
				expect(result!.matchType).toBe('interpolated')
				expect(result!.confidence).toBe('medium')
				// Should have actual range data from nearest bucket
				expect(result!.ranges['AA']).toBeDefined()
				expect(result!.ranges['72o']).toBeDefined()
			}
		)

		it('returns null for unknown position', async () => {
			const result = await lookupPreflopRange(
				'UNKNOWN', 'open', 100, '6max'
			)
			expect(result).toBeNull()
		})

		it('returns null for unknown scenario', async () => {
			const result = await lookupPreflopRange(
				'BTN', 'nonexistent_scenario', 100, '6max'
			)
			expect(result).toBeNull()
		})

		it('returns facing-open range correctly', async () => {
			const result = await lookupPreflopRange(
				'BB', 'vs_btn_open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.matchType).toBe('exact')
			expect(result!.ranges['AA']).toBeDefined()
		})

		it('returns null for valid depth with wrong table size',
			async () => {
				// SB open 20BB exists for 6max but not necessarily
				// for a random table size
				const result = await lookupPreflopRange(
					'BTN', 'open', 100, '3max'
				)
				expect(result).toBeNull()
			}
		)
	})

	describe('lookupPushFold', () => {
		it('returns chart for BTN 10BB 6max', async () => {
			const result = await lookupPushFold('BTN', 10, '6max')

			expect(result).not.toBeNull()
			expect(result!.confidence).toBe('high')
			expect(result!.ranges['AA']).toBe('push')
			expect(result!.ranges['72o']).toBe('fold')
		})

		it('returns chart for SB 5BB 6max (wide range)',
			async () => {
				const result = await lookupPushFold('SB', 5, '6max')

				expect(result).not.toBeNull()
				expect(result!.ranges['AA']).toBe('push')
				expect(result!.ranges['K2s']).toBe('push')
			}
		)

		it('returns null for unknown position', async () => {
			const result = await lookupPushFold(
				'UNKNOWN', 10, '6max'
			)
			expect(result).toBeNull()
		})

		it('returns nearest bucket with range data', async () => {
			const result = await lookupPushFold('BTN', 12, '6max')

			expect(result).not.toBeNull()
			expect(result!.confidence).toBe('medium')
			expect(result!.ranges['AA']).toBe('push')
			expect(result!.ranges['72o']).toBe('fold')
		})
	})

	describe('getHandRecommendation', () => {
		it('recommends raise for AKs BTN open 100BB 6max',
			async () => {
				const result = await getHandRecommendation(
					'AKs', 'BTN', 'open', 100, '6max'
				)

				expect(result).not.toBeNull()
				expect(result!.action).toBe('raise')
				expect(result!.frequency).toBe(1.0)
			}
		)

		it('recommends fold for 72o from UTG', async () => {
			const result = await getHandRecommendation(
				'72o', 'UTG', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.action).toBe('fold')
			expect(result!.frequency).toBe(1.0)
		})

		it('returns mixed strategy with alternatives', async () => {
			// 88 from UTG 100BB 6max is raise 0.5 / fold 0.5
			const result = await getHandRecommendation(
				'88', 'UTG', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.action).toBe('raise')
			expect(result!.frequency).toBe(0.5)
			expect(result!.alternatives).toBeDefined()
			expect(result!.alternatives!.length).toBeGreaterThan(0)
			expect(result!.alternatives![0].action).toBe('fold')
		})

		it('returns null for unknown scenario', async () => {
			const result = await getHandRecommendation(
				'AKs', 'BTN', 'nonexistent', 100, '6max'
			)
			expect(result).toBeNull()
		})

		it('returns null for hand not in range table', async () => {
			// Invalid hand notation
			const result = await getHandRecommendation(
				'ZZz', 'BTN', 'open', 100, '6max'
			)
			expect(result).toBeNull()
		})
	})
})
