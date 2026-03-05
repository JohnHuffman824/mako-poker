---
title: "Plan 1: Repository Cleanup & Snapshot"
type: plan
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, plan, cleanup, repository, migration]
related: [poker-assistant/00-index, poker-assistant/07-mako-poker-assessment, 02-ai-infrastructure, 03-mvp-implementation]
---

# Plan 1: Repository Cleanup & Snapshot

> Preserve the current Mako Poker codebase on a snapshot branch, then strip main down to a minimal foundation for the Poker Assistant.

## Goal

Create a clean starting point for the Poker Assistant. The snapshot branch preserves everything so we can cherry-pick later if needed. Main gets stripped to: auth, hand evaluator, position service, shared types, solver, Drizzle/DB setup, and monorepo configuration.

## Prerequisites

- Current main branch is stable and committed
- No in-progress work on other branches (confirmed — only `main` exists)

## Decisions Log

These decisions were made during planning and override anything in earlier design docs:

| Question | Decision | Rationale |
|----------|----------|-----------|
| Push snapshot to remote? | Yes | Safety — remote backup before destructive changes |
| `pot-service.ts` (518+ tests) | Remove from main | Snapshot preserves it; not needed for assistant MVP |
| `betting-service.ts` | Remove from main | Snapshot preserves it; assistant doesn't run games |
| `packages/inference/` | Remove from main | Fresh start is cleaner; snapshot preserves it for later |
| Stub new DB tables? | No | Defer to Plan 3; just remove old game tables here |
| Preserve local DB data? | No | All development/test data, safe to wipe |
| Verify solver functionality? | No | Just confirm files are present; solver testing is a separate issue |
| `events.ts` route | Remove | Game event history — not needed for assistant |
| Test directory structure | Currently `src/test/`; future should mirror `src/` structure |

## Phase 1: Baseline & Snapshot

### Task 1.1: Establish test baseline

Run the full test suite on current main to document what passes before any changes.

```bash
bun test
```

Record the output (test count, pass/fail). This is our reference — after cleanup, remaining tests must still pass.

### Task 1.2: Create snapshot branch

```bash
git checkout -b snapshot/mako-poker-v1
git push -u origin snapshot/mako-poker-v1
git tag v1.0-mako-poker
git push origin v1.0-mako-poker
git checkout main
```

Verify:
- [ ] Branch exists on remote: `git branch -r | grep snapshot`
- [ ] Tag exists on remote: `git ls-remote --tags origin | grep v1.0`

## Phase 2: Remove Web Frontend

The entire `apps/web/` directory goes — including the committed `dist/` build artifacts.

### Task 2.1: Delete `apps/web/`

```bash
rm -rf apps/web/
```

### Task 2.2: Update root `package.json`

Remove web-specific scripts. The `workspaces` field uses `"apps/*"` glob so it auto-adjusts.

**Remove these scripts:**
- `dev:web`

**Update these scripts:**
- `dev` — remove `--filter '*'` approach if it tries to start web, or just let it skip the missing workspace

**After:**
```json
{
  "scripts": {
    "db:start": "docker-compose up -d db",
    "db:stop": "docker-compose down",
    "db:logs": "docker-compose logs -f db",
    "dev": "bun run db:start && bun run dev:api",
    "dev:api": "bun run db:start && bun run --filter api dev",
    "test": "bun run --filter '*' test",
    "build": "bun run --filter '*' build",
    "typecheck": "bun run --filter '*' typecheck"
  }
}
```

### Task 2.3: Verify after web removal

```bash
bun install
bun run typecheck
```

Confirm no broken imports referencing `apps/web/`.

## Phase 3: Remove Game Flow Code

Strip all game orchestration from the API. The assistant doesn't run poker games — it answers questions about them.

### Task 3.1: Remove game services

Delete these files from `apps/api/src/services/`:

| File | Reason |
|------|--------|
| `game-service.ts` | Game orchestration — not needed |
| `street-service.ts` | Dealing flop/turn/river — not needed |
| `showdown-service.ts` | Winner determination — not needed |
| `ai-service.ts` | AI player decisions — replaced by Claude + GTO |
| `betting-service.ts` | Betting validation — not needed for assistant |
| `pot-service.ts` | Pot/side pot calculations — not needed for assistant |

**Keep:**
| File | Reason |
|------|--------|
| `auth-service.ts` | JWT auth — carries forward |
| `position-service.ts` | Position naming/ordering — useful for GTO lookups |

### Task 3.2: Remove game domain files

Delete from `apps/api/src/domain/`:

| File | Reason |
|------|--------|
| `game-state.ts` | Game state management — not needed |
| `game-events.ts` | Event sourcing for games — not needed |
| `player.ts` | Player state helpers — not needed |

**Keep:**
| File | Reason |
|------|--------|
| `hand-evaluator.ts` | Core poker primitive — used for equity calculations |
| `hand-rankings.ts` | Hand ranking data — supports hand evaluator |

### Task 3.3: Remove game routes

Delete from `apps/api/src/routes/`:

| File | Reason |
|------|--------|
| `game.ts` | Game CRUD and action routes — not needed |
| `events.ts` | Game event history routes — not needed |

**Keep:**
| File | Reason |
|------|--------|
| `auth.ts` | Auth routes carry forward |
| `health.ts` | Health check carries forward |

### Task 3.4: Update API entry point

Edit `apps/api/src/index.ts` to remove game and event route imports/registration:

**Before:**
```typescript
import { gameRoutes } from './routes/game'
import { eventRoutes } from './routes/events'
// ...
.use(gameRoutes)
.use(eventRoutes)
```

**After:**
```typescript
// Remove game and event imports entirely
// Only keep: healthRoutes, authRoutes
```

### Task 3.5: Remove game test files

Delete from `apps/api/src/test/`:

| File | Reason |
|------|--------|
| `integration/game-flow.spec.ts` | Tests removed game service |
| `services/ai-service.spec.ts` | Tests removed service |
| `services/betting-rules.spec.ts` | Tests removed service |
| `services/betting-service.spec.ts` | Tests removed service |
| `services/game-events.spec.ts` | Tests removed domain |
| `services/player-management.spec.ts` | Tests removed domain |

**Keep:**
| File | Reason |
|------|--------|
| `services/hand-evaluator.spec.ts` | Tests kept domain |
| `services/hand-evaluator-comprehensive.spec.ts` | Tests kept domain |
| `services/position-service.spec.ts` | Tests kept service |

### Task 3.6: Fix position-service imports

`position-service.ts` likely imports from game-state or player domain files. Check and fix any broken imports after deletions. The `buildActionOrderSeats` function was referenced by `game-state.ts` — if position-service itself doesn't import game-state, it should be fine. Verify.

### Task 3.7: Verify after game code removal

```bash
bun run typecheck
bun test
```

All remaining tests (hand-evaluator, position-service) must pass.

## Phase 4: Remove Inference Package

### Task 4.1: Delete `packages/inference/`

```bash
rm -rf packages/inference/
```

The ONNX inference bridge is preserved in the snapshot branch. If we need neural network inference later (Tier 3 in [[poker-assistant/03-gto-engine]]), we can pull it back or rebuild fresh.

### Task 4.2: Verify no cross-references

Check that nothing in `apps/api/` or `packages/shared/` imports from `@mako/inference` or `packages/inference/`.

```bash
bun run typecheck
```

## Phase 5: Clean Database Schema

### Task 5.1: Strip game-specific tables

Edit `apps/api/src/db/schema.ts`. Remove these tables:

| Table | Reason |
|-------|--------|
| `sessions` | Game playing sessions — not the same as assistant session presets |
| `scenarios` | Individual hands for old analysis flow |
| `recommendations` | Old GTO recommendations format |
| `solverCache` | Old solver cache format |
| `games` | In-memory game persistence |

**Keep:**
| Table | Reason |
|-------|--------|
| `users` | User accounts carry forward |
| `userRoles` | User permissions carry forward |

**Do NOT add new tables yet** — that's [[03-mvp-implementation]] Phase 1.

### Task 5.2: Clean up unused imports

After removing tables, clean up any unused imports from `drizzle-orm/pg-core` (like `jsonb`, `bigint`, `decimal` if no longer needed).

### Task 5.3: Verify schema

```bash
cd apps/api && bun run db:push
```

This will sync the stripped schema to the local DB. Since we don't need to preserve data, this is safe.

## Phase 6: Clean Shared Package

### Task 6.1: Remove game-specific types

Review `packages/shared/src/types/` and remove types only used by the game:

| File | Action | Reason |
|------|--------|--------|
| `game.ts` | Remove | `GameState`, `StartGameRequest`, `PlayerActionRequest`, `SidePot`, `AvailableActions` — all game-specific |
| `player.ts` | Review | Keep `ActionType` if it's generic; remove game-specific player state types |
| `card.ts` | Keep | Card, Rank, Suit — fundamental poker types |
| `hand.ts` | Keep | Hand evaluation types |
| `auth.ts` | Keep | Auth types |

### Task 6.2: Remove game-specific constants

Review `packages/shared/src/constants/`:

| File | Action | Reason |
|------|--------|--------|
| `game.ts` | Trim | Keep `POSITION_NAMES` (useful for assistant). Remove `GAME_DEFAULTS`, `TIMING` (game-specific) |
| `hand-eval.ts` | Keep | Hand evaluation constants |
| `rank.ts` | Keep | Rank constants |
| `ui.ts` | Remove | UI constants for web frontend |

### Task 6.3: Update index exports

Update `packages/shared/src/types/index.ts` and `packages/shared/src/constants/index.ts` to remove exports of deleted modules.

Update `packages/shared/src/index.ts` to match.

### Task 6.4: Check for `createShuffledDeck`

`game-state.ts` imports `createShuffledDeck` from `@mako/shared`. Check if this utility is defined in shared and whether anything remaining uses it. If only game code used it, remove it.

### Task 6.5: Verify shared package

```bash
bun run typecheck
bun test
```

## Phase 7: Final Verification

### Task 7.1: Full verification checklist

- [ ] `bun install` succeeds
- [ ] `bun run typecheck` — no type errors in any workspace
- [ ] `bun test` — all remaining tests pass (hand-evaluator + position-service)
- [ ] API starts: `bun run dev:api` — boots without errors
- [ ] Auth endpoints work: `POST /auth/register`, `POST /auth/login`
- [ ] Health endpoint: `GET /health` returns 200
- [ ] Solver directory present: `solver/` exists with Python files intact
- [ ] No dead imports or broken references
- [ ] No references to removed files in remaining code

### Task 7.2: Update CLAUDE.md (minimal)

Make minimal edits to `CLAUDE.md` to remove references to deleted code. Don't do a full rewrite — that's [[02-ai-infrastructure]]. Just:
- Remove `dev:web` from commands
- Remove references to `apps/web/`
- Remove references to deleted services and routes
- Note that a full rewrite is planned

### Task 7.3: Commit and push

Single commit with a clear message describing the cleanup:

```
strip game engine code, keep poker primitives for assistant

Remove: web frontend, game services (game, betting, pot, showdown,
street, ai), game routes, game domain (state, events, player),
inference package, game-specific DB tables and shared types.

Keep: hand evaluator, position service, auth, solver, shared card/
hand types, Drizzle setup, monorepo config.

Full original codebase preserved on snapshot/mako-poker-v1 branch.
```

Push to main.

### Task 7.4: Confirm snapshot intact

```bash
git branch -r | grep snapshot
```

Verify the snapshot branch still exists on remote and wasn't affected.

## What Remains After Cleanup

```
mako-poker/
  apps/
    api/
      src/
        domain/
          hand-evaluator.ts      # Core poker evaluation
          hand-rankings.ts       # Hand ranking data
        services/
          auth-service.ts        # JWT authentication
          position-service.ts    # Position naming/ordering
        routes/
          auth.ts                # Auth endpoints
          health.ts              # Health check
        db/
          client.ts              # Drizzle DB client
          schema.ts              # users + userRoles tables only
        test/
          services/
            hand-evaluator.spec.ts
            hand-evaluator-comprehensive.spec.ts
            position-service.spec.ts
        index.ts                 # API entry (auth + health routes)
  packages/
    shared/
      src/
        types/
          card.ts                # Card, Rank, Suit
          hand.ts                # Hand evaluation types
          auth.ts                # Auth types
        constants/
          game.ts                # POSITION_NAMES only
          hand-eval.ts           # Hand eval constants
          rank.ts                # Rank constants
  solver/                        # Python CFR solver (untouched)
  docs/                          # Planning docs (untouched)
  CLAUDE.md                      # Minimally updated
  package.json                   # Updated scripts
```

## Risk Mitigation

- Snapshot branch + tag created FIRST before any deletions
- Snapshot pushed to remote before proceeding
- Each phase is independently verifiable (`typecheck` + `test` after each)
- Can cherry-pick any file from `snapshot/mako-poker-v1` if needed later
- No database data needs preservation

## Dependencies

- **Blocks**: [[02-ai-infrastructure]] (CLAUDE.md rewrite depends on cleanup being done first)
- **Blocked by**: Nothing — this is the first plan to execute
