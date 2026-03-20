/**
 * Seed runner — inserts curated GTO data into the database.
 *
 * Usage: bun run db:seed
 *
 * Runs inside a transaction — if any insert fails, the
 * entire seed is rolled back and existing data is preserved.
 */

import { db } from '../client'
import { preflopRanges, pushFoldCharts } from '../schema'
import { preflopRangeData } from './preflop-ranges'
import { pushFoldData } from './push-fold-charts'

async function seed() {
	const start = Date.now()

	await db.transaction(async (tx) => {
		await tx.delete(preflopRanges)
		await tx.delete(pushFoldCharts)

		await tx.insert(preflopRanges).values(
			preflopRangeData.map((e) => ({
				position: e.position,
				scenario: e.scenario,
				stackDepthBb: e.stackDepthBb,
				tableSize: e.tableSize,
				ranges: e.ranges,
				source: e.source,
			}))
		)

		await tx.insert(pushFoldCharts).values(
			pushFoldData.map((e) => ({
				position: e.position,
				stackDepthBb: e.stackDepthBb,
				tableSize: e.tableSize,
				ranges: e.ranges,
				source: e.source,
			}))
		)
	})

	const elapsed = Date.now() - start
	const preflopCount = preflopRangeData.length
	const pushFoldCount = pushFoldData.length

	process.stdout.write(
		`Seeded ${preflopCount + pushFoldCount} tables ` +
		`in ${elapsed}ms\n` +
		`  Preflop ranges: ${preflopCount}\n` +
		`  Push/fold charts: ${pushFoldCount}\n`
	)
}

seed().catch((err) => {
	process.stderr.write(`Seed failed: ${err.message}\n`)
	process.exit(1)
})
