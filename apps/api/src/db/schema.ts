import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	primaryKey,
	index
} from 'drizzle-orm/pg-core'

/**
 * Users table - stores user account information.
 */
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	displayName: varchar('display_name', { length: 100 }),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	lastLogin: timestamp('last_login', { withTimezone: true })
}, (table) => [
	index('idx_users_email').on(table.email)
])

/**
 * User roles table - stores user permissions.
 */
export const userRoles = pgTable('user_roles', {
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	role: varchar('role', { length: 50 }).notNull()
}, (table) => [
	primaryKey({ columns: [table.userId, table.role] })
])
