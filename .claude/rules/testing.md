---
paths: 'test/**, apps/api/test/**, *.test.ts, *.spec.ts'
---

# Testing Conventions

## Runner

Bun test runner — not Jest, not Vitest.

```bash
bun test                              # all tests
bun test test/path/to/file.spec.ts    # specific file
```

## TDD Required

Write tests first: Red (failing test) -> Green (make it pass) -> Refactor.
Use the `/tdd` skill for implementation work.

## Directory Structure

Tests mirror `src/` structure under `test/`:
```
src/services/auth-service.ts   -> test/services/auth-service.spec.ts
src/domain/hand-evaluator.ts   -> test/domain/hand-evaluator.spec.ts
```

## Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'

describe('AuthService', () => {
  describe('register', () => {
    it('creates user with valid credentials', () => { ... })
    it('rejects duplicate email', () => { ... })
  })
})
```

## No Mocks

Use real implementations, not mocks. Mock only at system boundaries (external APIs, Claude calls).

## Anti-Patterns

- No `test.skip` or `test.todo` without a tracking issue
- No shared mutable state between tests
- No testing implementation details (test behavior, not internals)
- No snapshot tests unless explicitly justified

## Skills

- `/tdd` — Test-driven development workflow
- `/debug` — Systematic debugging when tests fail
