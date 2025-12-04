import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

/**
 * Type for the JWT verify result.
 */
interface JwtVerifyResult {
  sub: string
  iat: number
  exp: number
}

/**
 * User payload extracted from JWT.
 */
export interface AuthUser {
  id: string
  iat: number
  exp: number
}

/**
 * Authentication middleware that validates JWT tokens.
 * Adds user context to the request.
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET,
    exp: '7d'
  }))
  .derive({ as: 'scoped' }, async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { user: null as AuthUser | null, error: 'Missing authorization' }
    }

    const token = authHeader.slice(7)

    try {
      const payload = await jwt.verify(token) as JwtVerifyResult | false

      if (!payload) {
        set.status = 401
        return { user: null as AuthUser | null, error: 'Invalid token' }
      }

      return {
        user: {
          id: payload.sub,
          iat: payload.iat,
          exp: payload.exp
        } as AuthUser,
        error: null
      }
    } catch {
      set.status = 401
      return { user: null as AuthUser | null, error: 'Token verification failed' }
    }
  })
  .onBeforeHandle(({ user, error, set }) => {
    if (!user) {
      set.status = 401
      return { error: error ?? 'Unauthorized' }
    }
  })

/**
 * Optional auth middleware that doesn't require authentication.
 * Still parses token if present.
 */
export const optionalAuthMiddleware = new Elysia({ name: 'optional-auth' })
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET,
    exp: '7d'
  }))
  .derive({ as: 'scoped' }, async ({ jwt, headers }) => {
    const authHeader = headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null as AuthUser | null }
    }

    const token = authHeader.slice(7)

    try {
      const payload = await jwt.verify(token) as JwtVerifyResult | false

      if (!payload) {
        return { user: null as AuthUser | null }
      }

      return {
        user: {
          id: payload.sub,
          iat: payload.iat,
          exp: payload.exp
        } as AuthUser
      }
    } catch {
      return { user: null as AuthUser | null }
    }
  })
