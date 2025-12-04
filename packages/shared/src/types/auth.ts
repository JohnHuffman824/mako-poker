/**
 * User account information.
 */
export interface User {
  id: string
  email: string
  displayName?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

/**
 * Request to register a new user.
 */
export interface RegisterRequest {
  email: string
  password: string
  displayName?: string
}

/**
 * Request to login.
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Authentication response with user and token.
 */
export interface AuthResponse {
  user: User
  token: string
}

/**
 * JWT payload structure.
 */
export interface JwtPayload {
  sub: string
  iat: number
  exp: number
}

