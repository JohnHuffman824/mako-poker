/**
 * Seed runner — inserts curated GTO data into the database.
 *
 * Usage: bun run db:seed
 */

import { db } from '../client'
import { preflopRanges, pushFoldCharts } from '../schema'
import { preflopRangeData } from './preflop-ranges'
import { pushFoldData } from './push-fold-charts'

async function seed() {
	const start = Date.now()

	// Clear existing data
	await db.delete(preflopRanges)
	await db.delete(pushFoldCharts)

	// Insert preflop ranges
	let preflopCount = 0
	for (const entry of preflopRangeData) {
		await db.insert(preflopRanges).values({
			position: entry.position,
			scenario: entry.scenario,
			stackDepthBb: entry.stackDepthBb,
			tableSize: entry.tableSize,
			ranges: entry.ranges,
			source: entry.source,
		})
		preflopCount++
	}

	// Insert push/fold charts
	let pushFoldCount = 0
	for (const entry of pushFoldData) {
		await db.insert(pushFoldCharts).values({
			position: entry.position,
			stackDepthBb: entry.stackDepthBb,
			tableSize: entry.tableSize,
			ranges: entry.ranges,
			source: entry.source,
		})
		pushFoldCount++
	}

	const elapsed = Date.now() - start
	const total = preflopCount + pushFoldCount

	process.stdout.write(
		`Seeded ${total} tables in ${elapsed}ms\n` +
		`  Preflop ranges: ${preflopCount}\n` +
		`  Push/fold charts: ${pushFoldCount}\n`
	)

	process.exit(0)
}

seed().catch((err) => {
	process.stderr.write(`Seed failed: ${err.message}\n`)
	process.exit(1)
})
