Description: Systematic debugging workflow for any bug, error, or test failure. Use when something is broken, a test fails unexpectedly, or behavior doesn't match expectations.

# Debug

## Iron Law: NO FIXES WITHOUT ROOT CAUSE

Never apply a fix until you understand WHY the bug exists.

## Response Protocol

TYPE -> REPRODUCE -> EVIDENCE -> TRACE -> HYPOTHESIS -> TEST -> VERIFY

### 1. TYPE

Classify the bug:
- **Test failure**: expected vs actual mismatch
- **Runtime error**: exception, crash, hang
- **Logic error**: wrong behavior, no error thrown
- **Integration**: components work alone, fail together

### 2. REPRODUCE

Make the bug happen reliably:

```bash
bun test test/path/to/failing.spec.ts
```

If you can't reproduce, you can't fix. Get reproduction first.

### 3. EVIDENCE

Gather facts. Read error messages, stack traces, test output. No guessing.

### 4. TRACE

Follow the code path from entry to failure:
- Read the failing test
- Read the code under test
- Trace the execution path
- Identify where expected diverges from actual

### 5. HYPOTHESIS

Form a specific, testable hypothesis: "The bug is caused by X because Y."

### 6. TEST

Write a test that proves your hypothesis:
- If hypothesis is correct, test fails in the expected way
- If hypothesis is wrong, reconsider at step 4

### 7. VERIFY

After the fix:
```bash
bun test                    # All tests pass
bun run typecheck           # Types clean
```

## Debugging Levels

| Level | When | Approach |
|-------|------|----------|
| Quick | Obvious cause (typo, wrong import) | Fix directly, verify |
| Standard | Most bugs | Full protocol above |
| Deep | Multi-layer issue | Add logging, trace across boundaries |
| Architectural | Design flaw | Document, propose redesign |

## Mako-Specific Checks

- **Elysia routes**: Check route registration, middleware order, validation schemas
- **Drizzle queries**: Check schema types match query expectations
- **@mako/shared imports**: Ensure using `@mako/shared`, not relative paths
- **Card ranks**: Check for `'10'` instead of `'T'`

## Red Flags

| Flag | Reality |
|------|---------|
| "Quick fix, investigate later" | Investigate now. Quick fixes hide bugs. |
| "Try X and see" | Understand first, then fix. |
| "Probably X" | Prove it. Read the code. |
| Third attempt at same fix | Step back. Re-examine hypothesis. |
