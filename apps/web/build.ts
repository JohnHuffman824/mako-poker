#!/usr/bin/env bun

/**
 * Production build script using Bun's bundler
 * Bundles the application and outputs to dist directory
 */

import { rmSync, mkdirSync, cpSync } from 'fs'
import { resolve } from 'path'

const outdir = './dist'

// Clean dist directory
console.log('🧹 Cleaning dist directory...')
rmSync(outdir, { recursive: true, force: true })
mkdirSync(outdir, { recursive: true })

// Build the application
console.log('📦 Building application...')
const result = await Bun.build({
	entrypoints: ['./src/main.tsx'],
	outdir,
	target: 'browser',
	format: 'esm',
	splitting: true,
	minify: true,
	sourcemap: 'external',
	naming: {
		entry: '[dir]/[name].[hash].[ext]',
		chunk: '[dir]/[name].[hash].[ext]',
		asset: '[dir]/[name].[hash].[ext]',
	},
	external: [],
	define: {
		'process.env.NODE_ENV': '"production"',
	},
})

if (!result.success) {
	console.error('❌ Build failed:')
	for (const log of result.logs) {
		console.error(log)
	}
	process.exit(1)
}

// Copy public assets
console.log('📁 Copying public assets...')
cpSync('./public', `${outdir}/public`, { recursive: true })

// Generate index.html with hashed bundle references
console.log('📝 Generating index.html...')
const indexTemplate = await Bun.file('./index.html').text()
const mainBundle = result.outputs.find(
	(o) => o.kind === 'entry-point'
)

if (!mainBundle) {
	console.error('❌ Could not find main bundle')
	process.exit(1)
}

const bundlePath = mainBundle.path.replace(
	resolve(outdir),
	''
)

const indexHtml = indexTemplate.replace(
	'/src/main.tsx',
	bundlePath
)

await Bun.write(`${outdir}/index.html`, indexHtml)

console.log('✅ Build complete!')
console.log(`📦 Output: ${outdir}`)
