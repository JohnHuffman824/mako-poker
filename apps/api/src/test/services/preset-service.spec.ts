import { describe, it, expect, beforeEach } from 'bun:test'
import {
	createPreset,
	listPresets,
	updatePreset,
	deletePreset,
	activatePreset,
	getActivePreset,
} from '../../services/preset-service'
import { db } from '../../db/client'
import { sessionPresets, users } from '../../db/schema'
import { eq } from 'drizzle-orm'

let testUserId: string

beforeEach(async () => {
	// Clean up presets from previous test runs
	await db.delete(sessionPresets)

	// Create or reuse a test user
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.email, 'preset-test@mako.dev'))
		.limit(1)

	if (existing.length > 0) {
		testUserId = existing[0].id
	} else {
		const [user] = await db.insert(users).values({
			email: 'preset-test@mako.dev',
			passwordHash: 'test-hash',
			displayName: 'Test User',
		}).returning()
		testUserId = user.id
	}
})

describe('PresetService', () => {
	describe('createPreset', () => {
		it('creates a preset for a user', async () => {
			const preset = await createPreset(testUserId, {
				name: 'Weekly MTT',
				gameType: 'tournament',
				tableSize: '9max',
				defaultStackBb: 30,
			})

			expect(preset.id).toBeDefined()
			expect(preset.name).toBe('Weekly MTT')
			expect(preset.gameType).toBe('tournament')
			expect(preset.tableSize).toBe('9max')
			expect(preset.defaultStackBb).toBe(30)
			expect(preset.isActive).toBe(false)
		})
	})

	describe('listPresets', () => {
		it('returns all presets for a user', async () => {
			await createPreset(testUserId, {
				name: 'MTT',
				gameType: 'tournament',
				tableSize: '9max',
			})
			await createPreset(testUserId, {
				name: 'Cash',
				gameType: 'cash',
				tableSize: '6max',
			})

			const presets = await listPresets(testUserId)

			expect(presets.length).toBe(2)
		})
	})

	describe('updatePreset', () => {
		it('updates preset fields', async () => {
			const preset = await createPreset(testUserId, {
				name: 'Old Name',
				gameType: 'cash',
				tableSize: '6max',
			})

			const updated = await updatePreset(
				preset.id, testUserId, { name: 'New Name' }
			)

			expect(updated).not.toBeNull()
			expect(updated!.name).toBe('New Name')
			expect(updated!.gameType).toBe('cash')
		})

		it('returns null for non-existent preset', async () => {
			const result = await updatePreset(
				'00000000-0000-0000-0000-000000000000',
				testUserId,
				{ name: 'Nope' }
			)
			expect(result).toBeNull()
		})
	})

	describe('deletePreset', () => {
		it('deletes a preset', async () => {
			const preset = await createPreset(testUserId, {
				name: 'To Delete',
				gameType: 'cash',
				tableSize: '6max',
			})

			const deleted = await deletePreset(
				preset.id, testUserId
			)
			expect(deleted).toBe(true)

			const presets = await listPresets(testUserId)
			expect(presets.length).toBe(0)
		})
	})

	describe('activatePreset', () => {
		it('activates a preset and deactivates others',
			async () => {
				const p1 = await createPreset(testUserId, {
					name: 'First',
					gameType: 'tournament',
					tableSize: '9max',
				})
				const p2 = await createPreset(testUserId, {
					name: 'Second',
					gameType: 'cash',
					tableSize: '6max',
				})

				await activatePreset(p1.id, testUserId)
				await activatePreset(p2.id, testUserId)

				const presets = await listPresets(testUserId)
				const active = presets.filter((p) => p.isActive)
				expect(active.length).toBe(1)
				expect(active[0].id).toBe(p2.id)
			}
		)
	})

	describe('getActivePreset', () => {
		it('returns null when no preset is active', async () => {
			const result = await getActivePreset(testUserId)
			expect(result).toBeNull()
		})

		it('returns the active preset', async () => {
			const preset = await createPreset(testUserId, {
				name: 'Active One',
				gameType: 'tournament',
				tableSize: '9max',
				defaultStackBb: 25,
			})
			await activatePreset(preset.id, testUserId)

			const active = await getActivePreset(testUserId)
			expect(active).not.toBeNull()
			expect(active!.name).toBe('Active One')
		})
	})
})
