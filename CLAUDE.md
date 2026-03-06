# Mako Poker

## Project Overview

Poker Assistant: mobile-first conversational GTO coach. Three-layer architecture: Mobile App -> Backend API -> GTO Data Layer. Two Claude calls per query: Parse (NL -> PokerScenario) -> Interpret (solver data -> explanation).

- **Backend**: Elysia (Bun) with PostgreSQL/Drizzle ORM
- **Solver**: Python CFR (offline computation via FastAPI)
- **Mobile**: React Native / Expo (planned)
- **AI**: Claude API (parse + interpret phases)
- **Shared**: `@mako/shared` TypeScript types and constants

## Commands

```bash
bun install                        # Install all dependencies
bun test                           # Run all tests
bun run typecheck                  # Type check all workspaces
bun run dev                        # Start DB + API
bun run dev:api                    # API only (http://localhost:8080)
cd apps/api && bun run db:push     # Push schema changes
cd apps/api && bun run db:generate # Generate migrations
cd apps/api && bun run db:studio   # Drizzle Studio GUI
bun run db:start                   # Start PostgreSQL container
bun run db:stop                    # Stop PostgreSQL container
bun run db:logs                    # View database logs
```

## Architecture

### Monorepo Structure

```
apps/api/           — Elysia backend (routes, services, domain, db)
packages/shared/    — @mako/shared types and constants
solver/             — Python CFR solver (not yet integrated)
docs/               — Plans, guides, research (symlinked to Obsidian vault)
```

### Backend (apps/api)

- **Framework**: Elysia with CORS and JWT auth plugins
- **Pattern**: Routes -> Services -> DB/Drizzle
- **Services**: auth-service (JWT auth), position-service (GTO position lookups)
- **Domain**: hand-evaluator, hand-rankings
- **Routes**: `/auth/*` (register, login, user), `/health`
- **DB**: Drizzle ORM, PostgreSQL — tables: users, userRoles

### Shared Package (packages/shared)

Types: card, player, hand, auth. Constants: game positions, hand-eval, ranks.

### Python Solver (solver/)

CFR+ and Deep CFR implementations. FastAPI server at `src/api/server.py`. Not yet integrated with main app.

## Conventions

See `.claude/coding-conventions.md` for full code style rules.

- Card ranks: single char (`'T'` not `'10'`) — see `.claude/rules/poker-domain.md`
- Use `@mako/shared` for cross-package imports, never relative paths

## Environment

```bash
# apps/api/.env
DATABASE_URL=postgresql://mako:mako@localhost:5432/mako
JWT_SECRET=your-secret-key-change-in-production
```

## IMPORTANT

- All code changes require TDD — no production code without failing test first
- Run `bun test && bun run typecheck` before claiming done
- Update docs when code changes (see `.claude/rules/doc-triggers.md`)
- No AI attribution in commits — no Co-Authored-By, no AI signatures
- Commit frequently, push after committing
- When a skill exists for a task, use it (see `.claude/rules/skill-routing.md`)
