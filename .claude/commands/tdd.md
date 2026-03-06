Description: Enforce strict Test-Driven Development workflow for all code changes. Use whenever writing new code, adding features, or fixing bugs. This is the primary development skill.

# TDD — Test-Driven Development

## STRICT ENFORCEMENT: NO PRODUCTION CODE WITHOUT FAILING TEST

Every code change follows: **RED -> GREEN -> REFACTOR -> REPEAT**

## The Cycle

### RED: Write a Failing Test

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'

describe('FeatureName', () => {
  it('does the specific thing', () => {
    const result = featureFunction(input)
    expect(result).toBe(expectedOutput)
  })
})
```

Run it. Watch it fail. If it passes, the test is wrong or the feature already exists.

```bash
bun test test/path/to/file.spec.ts
```

### GREEN: Write Minimal Implementation

Write the **minimum code** to make the test pass. No more.

- Don't optimize
- Don't handle edge cases yet
- Don't refactor
- Just make the test green

```bash
bun test test/path/to/file.spec.ts
```

### REFACTOR: Clean Up (Stay Green)

Now improve the code while keeping tests passing:
- Extract functions
- Improve naming
- Remove duplication

```bash
bun test test/path/to/file.spec.ts
```

### REPEAT

Next behavior? Write the next failing test. Continue the cycle.

## Test Locations

```
apps/api/src/services/auth-service.ts  -> apps/api/test/services/auth-service.spec.ts
apps/api/src/routes/auth.ts            -> apps/api/test/routes/auth.spec.ts
packages/shared/src/types/card.ts      -> packages/shared/test/types/card.spec.ts
```

## Red Flags (STOP if you see these)

| Red Flag | Reality |
|----------|---------|
| Writing code before test | TDD violation — write test first |
| Test passes immediately | Test is wrong or feature exists |
| "Too simple to test" | Simple code breaks. Test it. |
| "I'll add tests later" | You won't. Write them now. |
| Manually testing instead | Automate it. Manual doesn't count. |

## Commit Cadence

After each RED-GREEN-REFACTOR cycle completes, commit. Small, frequent commits.
