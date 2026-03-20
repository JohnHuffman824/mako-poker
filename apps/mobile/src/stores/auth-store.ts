/**
 * Auth store — manages JWT token and user state.
 * Uses expo-secure-store for persistent token storage.
 */

import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'mako_auth_token'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
  loading: boolean
}

let state: AuthState = {
  token: null,
  user: null,
  loading: true,
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState(): AuthState {
  return state
}

export async function loadToken(): Promise<string | null> {
  try {
    const token = Platform.OS === 'web'
      ? localStorage.getItem(TOKEN_KEY)
      : await SecureStore.getItemAsync(TOKEN_KEY)
    state = { ...state, token, loading: false }
    notify()
    return token
  } catch {
    state = { ...state, token: null, loading: false }
    notify()
    return null
  }
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  }
  state = { ...state, token }
  notify()
}

export function setUser(user: AuthUser | null): void {
  state = { ...state, user }
  notify()
}

export async function logout(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY)
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  }
  state = { token: null, user: null, loading: false }
  notify()
}
