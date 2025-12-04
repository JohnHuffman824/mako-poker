import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'
import { gameRoutes } from './routes/game'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export const app = new Elysia()
  .use(cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true
  }))
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET,
    exp: '7d'
  }))
  .use(healthRoutes)
  .use(authRoutes)
  .use(gameRoutes)
  .listen(process.env.PORT ?? 8080)

console.log(
  `🦈 Mako API running at http://${app.server?.hostname}:${app.server?.port}`
)
