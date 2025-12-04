import { Elysia } from 'elysia'

/**
 * Health check routes for liveness and readiness probes.
 */
export const healthRoutes = new Elysia({ prefix: '/health' })
  .get('/', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }))
  .get('/ready', () => ({
    status: 'ready',
    timestamp: new Date().toISOString()
  }))

