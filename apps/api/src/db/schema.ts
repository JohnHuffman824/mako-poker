import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  decimal,
  integer,
  bigint,
  jsonb,
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

/**
 * Sessions table - stores poker playing sessions.
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  handsPlayed: integer('hands_played').notNull().default(0),
  sessionPnl: decimal('session_pnl', { precision: 12, scale: 2 }).default('0'),
  gtoAdherence: decimal('gto_adherence', { precision: 5, scale: 2 }).default('0'),
  gameType: varchar('game_type', { length: 50 }).default('NLHE'),
  blinds: varchar('blinds', { length: 50 }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true })
}, (table) => [
  index('idx_sessions_user_id').on(table.userId),
  index('idx_sessions_started_at').on(table.startedAt)
])

/**
 * Scenarios table - individual hands for analysis.
 */
export const scenarios = pgTable('scenarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id, {
    onDelete: 'set null'
  }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  holeCards: varchar('hole_cards', { length: 10 }).notNull(),
  communityCards: varchar('community_cards', { length: 25 }),
  position: varchar('position', { length: 10 }).notNull(),
  playerCount: integer('player_count').notNull(),
  playerStack: decimal('player_stack', { precision: 12, scale: 2 }).notNull(),
  potSize: decimal('pot_size', { precision: 12, scale: 2 }).notNull(),
  blinds: varchar('blinds', { length: 20 }).notNull(),
  street: varchar('street', { length: 10 }).notNull().default('PREFLOP'),
  effectiveStack: decimal('effective_stack', { precision: 12, scale: 2 }),
  actionFacing: varchar('action_facing', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => [
  index('idx_scenarios_user_id').on(table.userId),
  index('idx_scenarios_session_id').on(table.sessionId),
  index('idx_scenarios_created_at').on(table.createdAt)
])

/**
 * Recommendations table - GTO analysis results.
 */
export const recommendations = pgTable('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenarioId: uuid('scenario_id')
    .notNull()
    .references(() => scenarios.id, { onDelete: 'cascade' }),
  recommendedAction: varchar('recommended_action', { length: 20 }).notNull(),
  actionConfidence: decimal('action_confidence', {
    precision: 5,
    scale: 2
  }).notNull(),
  foldPct: decimal('fold_pct', { precision: 5, scale: 2 }).default('0'),
  callPct: decimal('call_pct', { precision: 5, scale: 2 }).default('0'),
  raisePct: decimal('raise_pct', { precision: 5, scale: 2 }).default('0'),
  recommendedBetSize: decimal('recommended_bet_size', {
    precision: 12,
    scale: 2
  }),
  equity: decimal('equity', { precision: 5, scale: 4 }).notNull(),
  expectedValue: decimal('expected_value', { precision: 12, scale: 4 }),
  potOdds: varchar('pot_odds', { length: 20 }),
  calculationTimeMs: integer('calculation_time_ms'),
  solverIterations: integer('solver_iterations'),
  solverDepth: integer('solver_depth'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => [
  index('idx_recommendations_scenario_id').on(table.scenarioId)
])

/**
 * Solver cache table - pre-computed solutions.
 */
export const solverCache = pgTable('solver_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  situationHash: varchar('situation_hash', { length: 64 }).notNull().unique(),
  strategyData: jsonb('strategy_data').notNull(),
  iterations: integer('iterations').notNull(),
  abstractionLevel: varchar('abstraction_level', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow(),
  accessCount: bigint('access_count', { mode: 'number' }).default(0)
}, (table) => [
  index('idx_solver_cache_hash').on(table.situationHash),
  index('idx_solver_cache_accessed_at').on(table.accessedAt)
])

/**
 * Games table - in-memory game state (for persistence).
 */
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  gameState: jsonb('game_state').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [
  index('idx_games_user_id').on(table.userId)
])

