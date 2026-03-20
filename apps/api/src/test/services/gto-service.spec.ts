import { describe, it, expect } from 'bun:test'
import {
	lookupPreflopRange,
	lookupPushFold,
	getHandRecommendation,
} from '../../services/gto-service'

/**
 * These tests require a seeded database.
 * Run `bun run db:seed` before running tests.
 */

describe('GtoService', () => {
	describe('lookupPreflopRange', () => {
		it('returns exact match for BTN open 100BB 6max', async () => {
			const result = await lookupPreflopRange(
				'BTN', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.matchType).toBe('exact')
			expect(result!.confidence).toBe('high')
			expect(result!.ranges).toBeDefined()
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

		it('returns interpolated match for 22BB (nearest to 20BB)',
			async () => {
				const result = await lookupPreflopRange(
					'BTN', 'open', 22, '6max'
				)

				expect(result).not.toBeNull()
				expect(result!.matchType).toBe('interpolated')
				expect(result!.confidence).toBe('medium')
				expect(result!.ranges).toBeDefined()
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
	})

	describe('lookupPushFold', () => {
		it('returns push/fold chart for BTN 10BB 6max', async () => {
			const result = await lookupPushFold('BTN', 10, '6max')

			expect(result).not.toBeNull()
			expect(result!.confidence).toBe('high')
			expect(result!.ranges['AA']).toBe('push')
			expect(result!.ranges['72o']).toBe('fold')
		})

		it('returns chart for SB 5BB 6max (wide pushing range)',
			async () => {
				const result = await lookupPushFold('SB', 5, '6max')

				expect(result).not.toBeNull()
				expect(result!.ranges['AA']).toBe('push')
				// SB at 5BB should push very wide
				expect(result!.ranges['K2s']).toBe('push')
			}
		)

		it('returns null for unknown position', async () => {
			const result = await lookupPushFold('UNKNOWN', 10, '6max')

			expect(result).toBeNull()
		})

		it('returns nearest bucket for non-exact stack depth',
			async () => {
				const result = await lookupPushFold('BTN', 12, '6max')

				expect(result).not.toBeNull()
				expect(result!.confidence).toBe('medium')
			}
		)
	})

	describe('getHandRecommendation', () => {
		it('recommends raise for AKs BTN open 100BB 6max', async () => {
			const result = await getHandRecommendation(
				'AKs', 'BTN', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.action).toBe('raise')
			expect(result!.frequency).toBe(1.0)
		})

		it('recommends fold for 72o from UTG', async () => {
			const result = await getHandRecommendation(
				'72o', 'UTG', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.action).toBe('fold')
			expect(result!.frequency).toBe(1.0)
		})

		it('returns mixed strategy for borderline hands', async () => {
			const result = await getHandRecommendation(
				'88', 'UTG', 'open', 100, '6max'
			)

			expect(result).not.toBeNull()
			expect(result!.action).toBe('raise')
			expect(result!.frequency).toBe(0.5)
			expect(result!.alternatives).toBeDefined()
			expect(result!.alternatives!.length).toBeGreaterThan(0)
		})

		it('returns null for unknown scenario', async () => {
			const result = await getHandRecommendation(
				'AKs', 'BTN', 'nonexistent', 100, '6max'
			)

			expect(result).toBeNull()
		})
	})
})
