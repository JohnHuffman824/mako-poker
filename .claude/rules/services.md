---
paths: 'apps/api/src/services/**'
---

# Service Layer Conventions

## Role

Services are the business logic layer between API routes and data access.

```
API Route -> Service -> DB/Drizzle
```

## Rules

- Services never handle HTTP concerns (no `req`/`res`)
- Throw domain-specific errors, let routes translate to HTTP responses
- One service per domain area
- No raw SQL in services — delegate to Drizzle queries

## Error Handling

- Throw typed domain errors, not generic `Error`
- Let the API layer catch and translate to HTTP status codes

## File Naming

kebab-case: `auth-service.ts`, `position-service.ts`, `gto-query-service.ts`

## File Naming

kebab-case: `auth-service.ts`, `position-service.ts`
