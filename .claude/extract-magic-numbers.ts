#!/usr/bin/env bun

/**
 * Extract Magic Numbers and Strings - Detection Only
 *
 * Scans TypeScript files for repeated numeric values, string literals,
 * and values that should be extracted to constants. Outputs raw data
 * for AI to review and make semantic decisions about extraction.
 */

declare const Bun: {
	argv: string[]
	file(path: string): { exists(): Promise<boolean>; text(): Promise<string> }
}

declare const process: {
	exit(code: number): never
	cwd(): string
}

interface Usage {
	line: number
	content: string
}

type ValueMap = Map<string, Usage[]>

/** Retrieves the target file path from command line arguments */
function getTargetFile(): string {
	const filePath = Bun.argv[2]
	if (!filePath) {
		console.error('Usage: bun extract-magic-numbers.ts <file-path>')
		process.exit(1)
	}
	return filePath.startsWith('/') ? filePath : `${process.cwd()}/${filePath}`
}

/** Reads file content using Bun's native file API */
async function readFileContent(filePath: string): Promise<string> {
	const file = Bun.file(filePath)
	const exists = await file.exists()
	if (!exists) {
		console.error(`Error: File not found: ${filePath}`)
		process.exit(1)
	}
	return file.text()
}

/** Checks if a line is defining a constant or should be skipped */
function isConstDefinition(line: string): boolean {
	const trimmed = line.trim()
	return trimmed.startsWith('const ') ||
		trimmed.startsWith('export const ') ||
		trimmed.startsWith('readonly ') ||
		trimmed.includes(' as const')
}

/** Checks if a line should be skipped entirely */
function shouldSkipLine(line: string): boolean {
	const trimmed = line.trim()
	return trimmed.startsWith('//') ||
		trimmed.startsWith('*') ||
		trimmed.startsWith('/*') ||
		trimmed.startsWith('import ') ||
		trimmed.startsWith('export type ') ||
		trimmed.startsWith('export interface ') ||
		trimmed.startsWith('interface ') ||
		trimmed.startsWith('type ') ||
		trimmed == ''
}

/** Finds repeated numeric values in TypeScript content */
function findRepeatedNumbers(content: string): ValueMap {
	const values: ValueMap = new Map()
	const lines = content.split('\n')

	// Match standalone numbers (not in variable names or hex colors)
	const numberRegex = /(?<![a-zA-Z_$#])(-?\d+(?:\.\d+)?)(?![a-zA-Z_$x])/g

	lines.forEach((line, index) => {
		numberRegex.lastIndex = 0

		if (shouldSkipLine(line) || isConstDefinition(line)) {
			return
		}

		let match
		while ((match = numberRegex.exec(line)) != null) {
			const value = match[1]
			const num = parseFloat(value)

			// Skip common trivial values
			if ([0, 1, -1, 2, 100].includes(num)) {
				continue
			}

			// Skip array indices like [0], [1], [2]
			if (line.charAt(match.index - 1) == '[') {
				continue
			}

			if (!values.has(value)) {
				values.set(value, [])
			}
			values.get(value)!.push({
				line: index + 1,
				content: line.trim()
			})
		}
	})

	return values
}

/** Finds repeated string literals in TypeScript content */
function findRepeatedStrings(content: string): ValueMap {
	const values: ValueMap = new Map()
	const lines = content.split('\n')

	// Match single or double quoted strings
	const stringRegex = /(['"])([^'"\\]|\\.){2,}\1/g

	lines.forEach((line, index) => {
		stringRegex.lastIndex = 0

		if (shouldSkipLine(line) || isConstDefinition(line)) {
			return
		}

		let match
		while ((match = stringRegex.exec(line)) != null) {
			const value = match[0]

			// Skip common patterns that shouldn't be extracted
			const inner = value.slice(1, -1)
			if (
				inner.startsWith('http') ||
				inner.startsWith('/') ||
				inner.includes('${') ||
				inner.length <= 2
			) {
				continue
			}

			if (!values.has(value)) {
				values.set(value, [])
			}
			values.get(value)!.push({
				line: index + 1,
				content: line.trim()
			})
		}
	})

	return values
}

/** Finds values in object literals that could be constants */
function findPotentialConstants(content: string): ValueMap {
	const values: ValueMap = new Map()
	const lines = content.split('\n')

	// Match object property patterns with literal values
	const constCandidateRegex = /(\w+)\s*:\s*(['"][^'"]+['"]|\d+)/g

	lines.forEach((line, index) => {
		constCandidateRegex.lastIndex = 0

		if (shouldSkipLine(line)) {
			return
		}

		let match
		while ((match = constCandidateRegex.exec(line)) != null) {
			const propName = match[1]
			const propValue = match[2]
			const key = `${propName}: ${propValue}`

			if (!values.has(key)) {
				values.set(key, [])
			}
			values.get(key)!.push({
				line: index + 1,
				content: line.trim()
			})
		}
	})

	return values
}

/** Prints a section of repeated values if any exist */
function printSection(
	title: string,
	values: ValueMap,
	minOccurrences: number = 2
): boolean {
	const repeated = Array.from(values.entries())
		.filter(([_, usages]) => usages.length >= minOccurrences)
		.sort((a, b) => b[1].length - a[1].length)

	if (repeated.length == 0) {
		return false
	}

	console.log(`\n${'='.repeat(50)}`)
	console.log(title)
	console.log('='.repeat(50))

	repeated.forEach(([value, usages]) => {
		console.log(`\n${value} (${usages.length}x)`)
		usages.forEach(u => {
			console.log(`  Line ${u.line}: ${u.content}`)
		})
	})

	return true
}

/** Extracts the filename from a path */
function getBasename(filePath: string): string {
	const parts = filePath.split('/')
	return parts[parts.length - 1] ?? filePath
}

async function main(): Promise<void> {
	const filePath = getTargetFile()
	const fileName = getBasename(filePath)

	console.log(`\nAnalyzing: ${fileName}`)

	const content = await readFileContent(filePath)

	let foundAny = false

	const numbers = findRepeatedNumbers(content)
	if (printSection('REPEATED NUMBERS (Magic Numbers)', numbers)) {
		foundAny = true
	}

	const strings = findRepeatedStrings(content)
	if (printSection('REPEATED STRINGS', strings)) {
		foundAny = true
	}

	// Find potential constants (property:value pairs appearing 3+ times)
	const constants = findPotentialConstants(content)
	if (printSection('POTENTIAL CONSTANTS (3+ occurrences)', constants, 3)) {
		foundAny = true
	}

	if (!foundAny) {
		console.log('\nNo repeated values or potential constants found.')
	}

	console.log('')
}

main()
