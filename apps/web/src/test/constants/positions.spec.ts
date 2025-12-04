/**
 * Tests for position utility functions.
 * Verifies all seat positions, button positions, and bet marker positions
 * are correctly defined.
 */

import { describe, it, expect } from 'bun:test'
import {
	ALL_SEAT_POSITIONS,
	DEALER_BUTTON_POSITIONS,
	BET_MARKER_POSITIONS,
	getDealerButtonPosition,
	getBetMarkerPosition,
	TABLE_CENTER,
	TOTAL_SEATS,
} from '../../features/game/constants/positions'

describe('Position Utilities', () => {

	describe('getDealerButtonPosition', () => {

		it('returns correct coordinates for seat 0', () => {
			const pos = getDealerButtonPosition(0)
			expect(pos.top).toBe(DEALER_BUTTON_POSITIONS[0].top)
			expect(pos.left).toBe(DEALER_BUTTON_POSITIONS[0].left)
		})

		it('returns correct coordinates for seat 5', () => {
			const pos = getDealerButtonPosition(5)
			expect(pos.top).toBe(DEALER_BUTTON_POSITIONS[5].top)
			expect(pos.left).toBe(DEALER_BUTTON_POSITIONS[5].left)
		})

		it('returns correct coordinates for seat 9', () => {
			const pos = getDealerButtonPosition(9)
			expect(pos.top).toBe(DEALER_BUTTON_POSITIONS[9].top)
			expect(pos.left).toBe(DEALER_BUTTON_POSITIONS[9].left)
		})

		it('handles invalid negative seat index', () => {
			const pos = getDealerButtonPosition(-1)
			expect(pos.top).toBe(TABLE_CENTER.top)
			expect(pos.left).toBe(TABLE_CENTER.left)
		})

		it('handles invalid high seat index', () => {
			const pos = getDealerButtonPosition(15)
			expect(pos.top).toBe(TABLE_CENTER.top)
			expect(pos.left).toBe(TABLE_CENTER.left)
		})

		it('returns valid positions for all 10 seats', () => {
			for (let i = 0; i < 10; i++) {
				const pos = getDealerButtonPosition(i)
				expect(pos.top).toBeGreaterThan(0)
				expect(pos.left).toBeGreaterThan(0)
				expect(typeof pos.top).toBe('number')
				expect(typeof pos.left).toBe('number')
			}
		})
	})

	describe('getBetMarkerPosition', () => {

		it('returns correct coordinates for seat 0', () => {
			const pos = getBetMarkerPosition(0)
			expect(pos.top).toBe(BET_MARKER_POSITIONS[0].top)
			expect(pos.left).toBe(BET_MARKER_POSITIONS[0].left)
		})

		it('returns correct coordinates for seat 5', () => {
			const pos = getBetMarkerPosition(5)
			expect(pos.top).toBe(BET_MARKER_POSITIONS[5].top)
			expect(pos.left).toBe(BET_MARKER_POSITIONS[5].left)
		})

		it('handles invalid seat index gracefully', () => {
			const pos = getBetMarkerPosition(-1)
			expect(pos.top).toBe(TABLE_CENTER.top)
			expect(pos.left).toBe(TABLE_CENTER.left)
		})

		it('bet markers are closer to center than button markers', () => {
			// For each seat, bet marker should be closer to table center
			for (let i = 0; i < 10; i++) {
				const buttonPos = DEALER_BUTTON_POSITIONS[i]
				const betPos = BET_MARKER_POSITIONS[i]

				const buttonDist = Math.sqrt(
					Math.pow(buttonPos.left - TABLE_CENTER.left, 2) +
					Math.pow(buttonPos.top - TABLE_CENTER.top, 2)
				)
				const betDist = Math.sqrt(
					Math.pow(betPos.left - TABLE_CENTER.left, 2) +
					Math.pow(betPos.top - TABLE_CENTER.top, 2)
				)

				expect(betDist).toBeLessThanOrEqual(buttonDist)
			}
		})
	})

	describe('Seat Position Arrays', () => {

		it('ALL_SEAT_POSITIONS has exactly 10 seats', () => {
			expect(ALL_SEAT_POSITIONS.length).toBe(10)
		})

		it('DEALER_BUTTON_POSITIONS has exactly 10 positions', () => {
			expect(DEALER_BUTTON_POSITIONS.length).toBe(10)
		})

		it('BET_MARKER_POSITIONS has exactly 10 positions', () => {
			expect(BET_MARKER_POSITIONS.length).toBe(10)
		})

		it('TOTAL_SEATS constant is 10', () => {
			expect(TOTAL_SEATS).toBe(10)
		})

		it('all seat positions have valid coordinates', () => {
			ALL_SEAT_POSITIONS.forEach((pos, index) => {
				expect(pos.top).toBeGreaterThan(0)
				expect(pos.left).toBeGreaterThan(0)
				expect(pos.top).toBeLessThan(1000)
				expect(pos.left).toBeLessThan(1500)
			})
		})

		it('all positions are unique', () => {
			const posStrings = ALL_SEAT_POSITIONS.map(p => `${p.top},${p.left}`)
			const uniquePos = new Set(posStrings)
			expect(uniquePos.size).toBe(10)
		})
	})

	describe('TABLE_CENTER', () => {

		it('is defined with top and left coordinates', () => {
			expect(TABLE_CENTER.top).toBeGreaterThan(0)
			expect(TABLE_CENTER.left).toBeGreaterThan(0)
		})

		it('is roughly centered horizontally', () => {
			// Should be near 720 (1440 / 2)
			expect(TABLE_CENTER.left).toBeGreaterThan(600)
			expect(TABLE_CENTER.left).toBeLessThan(840)
		})

		it('is positioned in upper portion (accounting for bottom bar)', () => {
			// Should be in the upper portion due to 144px bottom bar
			expect(TABLE_CENTER.top).toBeLessThan(500)
		})
	})
})
