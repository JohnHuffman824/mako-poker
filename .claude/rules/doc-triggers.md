---
paths:
  - "docs/**"
  - "apps/api/src/services/**"
  - "apps/api/src/routes/**"
  - "apps/api/src/db/schema.ts"
  - "packages/shared/src/**"
  - ".claude/**"
---

# Documentation Update Triggers

## General Rule

**Every functional change must be accompanied by documentation updates.** This is not optional.

When you change how something works, you MUST:
1. Search for affected docs referencing the changed functionality
2. Update all matches to reflect new behavior
3. Check the trigger table below for path-specific mappings
4. Update `updated:` frontmatter date on any modified doc

Stale documentation is a bug. Treat it with the same urgency as broken tests.

## Path-Specific Triggers

| When You Change... | Update... |
|--------------------|-----------|
| `apps/api/src/services/*` | CLAUDE.md architecture section if new service |
| `apps/api/src/routes/*` | CLAUDE.md routes section |
| `apps/api/src/db/schema.ts` | Any DB documentation |
| `packages/shared/src/types/*` | CLAUDE.md shared package section |
| `packages/shared/src/constants/*` | CLAUDE.md if constants change |
| `.claude/rules/*` | Run context audit on changed file |
| `.claude/commands/*` | Update skill routing table if new skill |
| `docs/plans/*` | Update related plan cross-references |
| Any doc in `docs/` | Update `updated:` frontmatter date |
