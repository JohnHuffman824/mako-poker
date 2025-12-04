import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { User } from '@mako/shared'

/**
 * User creation result.
 */
export interface UserResult {
	id: string
	email: string
	displayName: string | null
	enabled: boolean
	createdAt: Date
}

/**
 * Registers a new user.
 */
export async function register(
	email: string,
	password: string,
	displayName?: string
): Promise<UserResult> {
	const existing = await db.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1)

	if (existing.length > 0) {
		throw new Error('Email already registered')
	}

	const passwordHash = await Bun.password.hash(password, {
		algorithm: 'bcrypt',
		cost: 10
	})

	const [user] = await db.insert(users)
		.values({
			email,
			passwordHash,
			displayName: displayName ?? null
		})
		.returning({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
			enabled: users.enabled,
			createdAt: users.createdAt
		})

	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		enabled: user.enabled,
		createdAt: user.createdAt ?? new Date()
	}
}

/**
 * Authenticates a user.
 */
export async function login(
	email: string,
	password: string
): Promise<UserResult | null> {
	const [user] = await db.select({
		id: users.id,
		email: users.email,
		passwordHash: users.passwordHash,
		displayName: users.displayName,
		enabled: users.enabled,
		createdAt: users.createdAt
	})
		.from(users)
		.where(eq(users.email, email))
		.limit(1)

	if (!user) return null

	const valid = await Bun.password.verify(password, user.passwordHash)
	if (!valid) return null

	await db.update(users)
		.set({ lastLogin: new Date() })
		.where(eq(users.id, user.id))

	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		enabled: user.enabled,
		createdAt: user.createdAt ?? new Date()
	}
}

/**
 * Gets user by ID.
 */
export async function getUserById(userId: string): Promise<UserResult | null> {
	const [user] = await db.select({
		id: users.id,
		email: users.email,
		displayName: users.displayName,
		enabled: users.enabled,
		createdAt: users.createdAt
	})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)

	if (!user) return null

	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		enabled: user.enabled,
		createdAt: user.createdAt ?? new Date()
	}
}

/**
 * Converts user result to API response format.
 */
export function toUserResponse(user: UserResult): User {
	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName ?? undefined,
		enabled: user.enabled,
		createdAt: user.createdAt.toISOString(),
		updatedAt: user.createdAt.toISOString()
	}
}
