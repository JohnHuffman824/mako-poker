---
paths: 'apps/api/src/routes/**, apps/api/src/index.ts'
---

# API Layer Conventions

## Architecture

```
API Route (src/routes/) -> Service (src/services/) -> DB (Drizzle)
```

- Routes handle HTTP concerns: parsing, validation, response formatting
- Services handle business logic and authorization
- Routes never access DB directly

## Framework: Elysia

- Input validation with Elysia's built-in `t.Object()` schema
- JWT auth via Elysia plugin
- CORS via Elysia plugin
- Group routes by resource: `/auth/*`, `/health`

## Input Validation

Validate all user input at the route level using Elysia's type system:

```typescript
app.post('/auth/register', ({ body }) => authService.register(body), {
  body: t.Object({
    email: t.String({ format: 'email' }),
    password: t.String({ minLength: 8 }),
    username: t.String()
  })
})
```

## Error Responses

Consistent shape: `{ error: string, details?: string }`

## Future

- SSE for streaming Claude responses
- Rate limiting for AI endpoints
