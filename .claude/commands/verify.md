Description: Run all quality gates before claiming work is complete. Use before saying "done", before committing, or when the user asks to verify.

# Verify

## Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

Run the commands. Read the output. Show the evidence.

## Quality Gates

```bash
bun test                    # All tests pass
bun run typecheck           # No type errors
```

## Verification Report

```
## Verification Report

### Tests
- Result: X passing, 0 failing
- Evidence: <paste relevant output>

### Types
- Result: clean / X errors
- Evidence: <paste relevant output>

### Status: PASS / FAIL
```

## Behavioral Traits

- Run commands BEFORE making claims
- Read FULL output, not just exit codes
- Never use "should", "probably", or "seems to"
- Never express satisfaction before verification
- Never trust previous runs — always run fresh

## Red Flags (STOP)

| Flag | Action |
|------|--------|
| Using "should pass" | Run it. Show evidence. |
| Expressing confidence before running | Run first, then report. |
| Trusting a previous run | Run again. State changes. |
| Partial verification | Run ALL gates, not just some. |
