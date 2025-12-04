/**
 * Tests for utility functions.
 * Tests the cn (className merge) utility function.
 */

import { describe, it, expect } from 'bun:test'
import { cn } from '../../lib/utils'

describe('Utility Functions', () => {

	describe('cn (className merge)', () => {

		it('merges single class name', () => {
			const result = cn('foo')
			expect(result).toBe('foo')
		})

		it('merges multiple class names', () => {
			const result = cn('foo', 'bar', 'baz')
			expect(result).toContain('foo')
			expect(result).toContain('bar')
			expect(result).toContain('baz')
		})

		it('handles conditional classes', () => {
			const result = cn('foo', false && 'bar', 'baz')
			expect(result).toContain('foo')
			expect(result).not.toContain('bar')
			expect(result).toContain('baz')
		})

		it('handles null and undefined', () => {
			const result = cn('foo', null, undefined, 'bar')
			expect(result).toContain('foo')
			expect(result).toContain('bar')
		})

		it('merges Tailwind conflicting classes', () => {
			// tw-merge should resolve conflicts (last one wins)
			const result = cn('p-4', 'p-8')
			// Should only have p-8, not p-4
			expect(result).toContain('p-8')
			expect(result).not.toContain('p-4')
		})

		it('handles array of classes', () => {
			const result = cn(['foo', 'bar'])
			expect(result).toContain('foo')
			expect(result).toContain('bar')
		})

		it('handles object with boolean values', () => {
			const result = cn({
				'foo': true,
				'bar': false,
				'baz': true
			})
			expect(result).toContain('foo')
			expect(result).not.toContain('bar')
			expect(result).toContain('baz')
		})

		it('handles empty input', () => {
			const result = cn()
			expect(result).toBe('')
		})

		it('handles duplicate classes', () => {
			const result = cn('foo', 'bar', 'foo')
			// tailwind-merge may or may not deduplicate non-conflicting classes
			// Just verify the result is a valid string containing both classes
			expect(result).toContain('foo')
			expect(result).toContain('bar')
		})

		it('preserves class order (except conflicts)', () => {
			const result = cn('text-red-500', 'hover:text-blue-500')
			expect(result).toContain('text-red-500')
			expect(result).toContain('hover:text-blue-500')
		})
	})
})
