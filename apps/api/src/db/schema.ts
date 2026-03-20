import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	jsonb,
	primaryKey,
	index,
	uniqueIndex
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

/**
 * Preflop ranges table - GTO opening and facing-open ranges.
 * Each row represents a complete range for a specific scenario.
 */
export const preflopRanges = pgTable('preflop_ranges', {
	id: uuid('id').primaryKey().defaultRandom(),
	position: varchar('position', { length: 10 }).notNull(),
	scenario: varchar('scenario', { length: 50 }).notNull(),
	stackDepthBb: integer('stack_depth_bb').notNull(),
	tableSize: varchar('table_size', { length: 10 }).notNull(),
	ranges: jsonb('ranges').notNull(),
	source: varchar('source', { length: 20 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
}, (table) => [
	uniqueIndex('idx_preflop_ranges_lookup').on(
		table.position,
		table.scenario,
		table.stackDepthBb,
		table.tableSize
	)
])

/**
 * Push/fold charts - short-stack shove-or-fold ranges.
 * Each row represents a push/fold chart for a position/stack/table.
 */
export const pushFoldCharts = pgTable('push_fold_charts', {
	id: uuid('id').primaryKey().defaultRandom(),
	position: varchar('position', { length: 10 }).notNull(),
	stackDepthBb: integer('stack_depth_bb').notNull(),
	tableSize: varchar('table_size', { length: 10 }).notNull(),
	ranges: jsonb('ranges').notNull(),
	source: varchar('source', { length: 20 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
}, (table) => [
	uniqueIndex('idx_push_fold_lookup').on(
		table.position,
		table.stackDepthBb,
		table.tableSize
	)
])
