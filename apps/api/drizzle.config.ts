import { defineConfig } from 'drizzle-kit'

const connectionString = process.env.DATABASE_URL ??
	'postgresql://mako:mako@localhost:5432/mako'

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: connectionString
	}
})
