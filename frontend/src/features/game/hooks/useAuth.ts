import { useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/api/client'

/**
 * Hook for authentication state and actions.
 */
export function useAuth() {
  const [, setLocation] = useLocation()

  const isAuthenticated = useCallback(() => {
    return !!api.getToken()
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    setLocation('/login')
  }, [setLocation])

  const redirectIfUnauthenticated = useCallback(() => {
    if (!isAuthenticated()) {
      setLocation('/login')
      return false
    }
    return true
  }, [isAuthenticated, setLocation])

  return {
    isAuthenticated,
    logout,
    redirectIfUnauthenticated,
  }
}

/**
 * Hook that redirects to login if not authenticated.
 * Use at the top of protected pages.
 */
export function useRequireAuth() {
  const { redirectIfUnauthenticated } = useAuth()

  useEffect(() => {
    redirectIfUnauthenticated()
  }, [redirectIfUnauthenticated])
}

