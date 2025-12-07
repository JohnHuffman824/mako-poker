#!/usr/bin/env bun

/**
 * Development server using Bun's built-in HTTP server
 * Bundles on-the-fly and proxies API requests
 */

import { extname } from 'path'
import { watch } from 'fs'

const DEV_PORT = 5173
const API_PORT = 8080
const SRC_DIR = './src'
const CSS_INPUT = './src/index.css'
const CSS_OUTPUT = './dist/output.css'
const JS_ENTRY = './src/main.tsx'
const PUBLIC_DIR = './public'
const INDEX_HTML = './index.html'

const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
}

// Cache for bundled output
let bundleCache: Uint8Array | null = null
let cssCache: string | null = null
let bundlePromise: Promise<void> | null = null

async function buildCSS() {
	console.log('🎨 Building CSS...')
	const proc = Bun.spawn(
		['bunx', 'tailwindcss', '-i', CSS_INPUT, '-o', CSS_OUTPUT, '--minify'],
		{
			cwd: process.cwd(),
			stdout: 'pipe',
			stderr: 'pipe',
		}
	)
	
	await proc.exited
	
	const file = Bun.file(CSS_OUTPUT)
	if (await file.exists()) {
		cssCache = await file.text()
		console.log('✅ CSS ready')
	}
}

async function buildBundle() {
	console.log('📦 Building bundle...')
	
	await buildCSS()
	
	const result = await Bun.build({
		entrypoints: [JS_ENTRY],
		target: 'browser',
		format: 'esm',
		splitting: false,
		minify: false,
		sourcemap: 'inline',
	})

	if (result.success && result.outputs[0]) {
		bundleCache = await result.outputs[0].arrayBuffer().then(
			(ab) => new Uint8Array(ab)
		)
		console.log('✅ Bundle ready')
	} else {
		console.error('❌ Bundle failed:', result.logs)
	}
}

// Initial build
await buildBundle()

/**
 * Rebuilds either CSS or full bundle based on changed file type
 */
async function handleFileChange(filename: string) {
	if (bundlePromise) return
	
	const isCssChange = filename.endsWith('.css')
	const buildTask = isCssChange ? buildCSS : buildBundle
	const logMessage = isCssChange 
		? '🎨 CSS changed, rebuilding...' 
		: '📝 Files changed, rebuilding...'
	
	console.log(logMessage)
	bundlePromise = buildTask()
	await bundlePromise
	bundlePromise = null
}

watch(SRC_DIR, { recursive: true }, async (event, filename) => {
	if (filename) {
		await handleFileChange(filename)
	}
})

const server = Bun.serve({
	port: DEV_PORT,
	async fetch(req) {
		const url = new URL(req.url)
		
		if (url.pathname.startsWith('/api')) {
			try {
				const apiPath = url.pathname.replace('/api', '')
				const backendUrl = `http://localhost:${API_PORT}${apiPath}`
				return await fetch(backendUrl, {
					method: req.method,
					headers: req.headers,
					body: req.body,
				})
			} catch (error) {
				console.error('❌ Backend proxy error:', error)
				return new Response('Backend not available', { status: 503 })
			}
		}

		if (url.pathname == '/styles.css') {
			if (!cssCache) {
				await buildCSS()
			}
			
			return new Response(cssCache, {
				headers: {
					'Content-Type': 'text/css',
					'Cache-Control': 'no-cache',
				},
			})
		}

		if (url.pathname == '/src/main.js' || url.pathname == '/src/main.tsx') {
			if (!bundleCache) {
				await buildBundle()
			}
			
			return new Response(bundleCache, {
				headers: {
					'Content-Type': 'application/javascript',
					'Cache-Control': 'no-cache',
				},
			})
		}

		if (url.pathname.startsWith('/assets/')) {
			const filePath = `${PUBLIC_DIR}${url.pathname}`
			const file = Bun.file(filePath)
			
			if (await file.exists()) {
				const ext = extname(url.pathname)
				return new Response(file, {
					headers: {
						'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
					},
				})
			}
		}

		const file = Bun.file(INDEX_HTML)
		return new Response(file, {
			headers: {
				'Content-Type': 'text/html',
			},
		})
	},
	development: true,
})

console.log(`🚀 Dev server running at http://localhost:${server.port}`)
console.log(`📡 Proxying /api requests to http://localhost:${API_PORT}`)
console.log(`👀 Watching for changes...`)
