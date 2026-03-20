/**
 * Preset service — CRUD for session presets.
 */

import { db } from '../db/client'
import { sessionPresets } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export interface CreatePresetInput {
	name: string
	gameType: string
	tableSize: string
	defaultStackBb?: number
}

export interface UpdatePresetInput {
	name?: string
	gameType?: string
	tableSize?: string
	defaultStackBb?: number | null
}

type Preset = typeof sessionPresets.$inferSelect

export async function createPreset(
	userId: string,
	input: CreatePresetInput
): Promise<Preset> {
	const [preset] = await db.insert(sessionPresets).values({
		userId,
		name: input.name,
		gameType: input.gameType,
		tableSize: input.tableSize,
		defaultStackBb: input.defaultStackBb ?? null,
	}).returning()
	return preset
}

export async function listPresets(
	userId: string
): Promise<Preset[]> {
	return await db
		.select()
		.from(sessionPresets)
		.where(eq(sessionPresets.userId, userId))
}

export async function updatePreset(
	presetId: string,
	userId: string,
	input: UpdatePresetInput
): Promise<Preset | null> {
	const updates: Record<string, unknown> = {}
	if (input.name != null) updates.name = input.name
	if (input.gameType != null) updates.gameType = input.gameType
	if (input.tableSize != null) updates.tableSize = input.tableSize
	if (input.defaultStackBb !== undefined) {
		updates.defaultStackBb = input.defaultStackBb
	}
	updates.updatedAt = new Date()

	const result = await db
		.update(sessionPresets)
		.set(updates)
		.where(
			and(
				eq(sessionPresets.id, presetId),
				eq(sessionPresets.userId, userId)
			)
		)
		.returning()

	return result.length > 0 ? result[0] : null
}

export async function deletePreset(
	presetId: string,
	userId: string
): Promise<boolean> {
	const result = await db
		.delete(sessionPresets)
		.where(
			and(
				eq(sessionPresets.id, presetId),
				eq(sessionPresets.userId, userId)
			)
		)
		.returning()

	return result.length > 0
}

export async function activatePreset(
	presetId: string,
	userId: string
): Promise<Preset | null> {
	return await db.transaction(async (tx) => {
		// Deactivate all presets for user
		await tx
			.update(sessionPresets)
			.set({ isActive: false })
			.where(eq(sessionPresets.userId, userId))

		// Activate the selected preset
		const result = await tx
			.update(sessionPresets)
			.set({ isActive: true, updatedAt: new Date() })
			.where(
				and(
					eq(sessionPresets.id, presetId),
					eq(sessionPresets.userId, userId)
				)
			)
			.returning()

		return result.length > 0 ? result[0] : null
	})
}

export async function getActivePreset(
	userId: string
): Promise<Preset | null> {
	const result = await db
		.select()
		.from(sessionPresets)
		.where(
			and(
				eq(sessionPresets.userId, userId),
				eq(sessionPresets.isActive, true)
			)
		)
		.limit(1)

	return result.length > 0 ? result[0] : null
}
