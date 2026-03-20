/**
 * HTTP client for the Mako Poker backend API.
 */

import { getState } from '../stores/auth-store'

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

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const { token } = getState()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function askQuestion(
  question: string
): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: authHeaders(),
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
