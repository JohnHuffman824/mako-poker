/**
 * Auth API calls — register, login, get current user.
 */

import type { AuthUser } from '../stores/auth-store'

const API_BASE = process.env.EXPO_PUBLIC_API_URL
  ?? 'http://localhost:8080'

interface AuthResponse {
  user: AuthUser
  token: string
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(
      body.error ?? `Registration failed (${response.status})`
    )
  }

  return await response.json() as AuthResponse
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(
      body.error ?? `Login failed (${response.status})`
    )
  }

  return await response.json() as AuthResponse
}

export async function getMe(
  token: string
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Session expired')
  }

  const body = await response.json() as { user: AuthUser }
  return body.user
}
