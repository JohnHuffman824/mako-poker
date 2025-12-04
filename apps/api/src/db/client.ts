import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Database connection string from environment variable.
 * Required: DATABASE_URL must be set.
 */
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is required.\n' +
    'For local development, create a .env file with:\n' +
    'DATABASE_URL=postgresql://mako:mako@localhost:5432/mako'
  )
}

/**
 * Postgres connection pool.
 */
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
})

/**
 * Drizzle database instance with schema.
 */
export const db = drizzle(client, { schema })

/**
 * Type-safe database client.
 */
export type Database = typeof db
