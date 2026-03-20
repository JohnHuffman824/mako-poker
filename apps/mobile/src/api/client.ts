/**
 * HTTP client for the Mako Poker backend API.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL
	?? 'http://localhost:8080'

export interface QueryResponse {
	answer: string
	confidence: 'high' | 'medium' | 'low'
	toolsUsed: string[]
	tokensUsed: number
	responseTimeMs: number
}

export interface ApiError {
	error: string
	details?: string
}

export async function askQuestion(
	question: string
): Promise<QueryResponse> {
	const response = await fetch(`${API_BASE}/query`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ question }),
	})

	if (!response.ok) {
		const body = await response.json().catch(
			() => ({ error: 'Request failed' })
		) as ApiError
		throw new Error(body.error ?? 'Request failed')
	}

	return await response.json() as QueryResponse
}
