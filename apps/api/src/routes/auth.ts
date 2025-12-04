import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import * as authService from '../services/auth-service'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

/**
 * Authentication routes.
 */
export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET,
    exp: '7d'
  }))

  .post('/register', async ({ body, jwt, set }) => {
    try {
      const user = await authService.register(
        body.email,
        body.password,
        body.displayName
      )

      const token = await jwt.sign({ sub: user.id })

      set.status = 201

      return {
        user: authService.toUserResponse(user),
        token
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Email already registered'
      ) {
        set.status = 409
        return { error: 'Email already registered' }
      }
      throw error
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 8 }),
      displayName: t.Optional(t.String())
    })
  })

  .post('/login', async ({ body, jwt, set }) => {
    const user = await authService.login(body.email, body.password)

    if (!user) {
      set.status = 401
      return { error: 'Invalid credentials' }
    }

    const token = await jwt.sign({ sub: user.id })

    return {
      user: authService.toUserResponse(user),
      token
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  .post('/logout', () => {
    // Client-side token invalidation
    return { message: 'Logged out successfully' }
  })

  .get('/me', async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { error: 'Missing authorization header' }
    }

    const token = authHeader.slice(7)

    try {
      const payload = await jwt.verify(token) as { sub: string } | false

      if (!payload) {
        set.status = 401
        return { error: 'Invalid token' }
      }

      const user = await authService.getUserById(payload.sub)

      if (!user) {
        set.status = 404
        return { error: 'User not found' }
      }

      return { user: authService.toUserResponse(user) }
    } catch {
      set.status = 401
      return { error: 'Token verification failed' }
    }
  })
