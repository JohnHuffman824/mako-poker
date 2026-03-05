# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note:** This CLAUDE.md needs a full rewrite as part of the AI infrastructure plan. The content below reflects the post-cleanup state.

## Project Overview

Mako Poker is being rebuilt as a GTO (Game Theory Optimal) poker assistant. The game engine has been stripped; only poker primitives remain.

- **Backend**: Elysia (Bun) with PostgreSQL and Drizzle ORM
- **Solver**: Python CFR (Counterfactual Regret Minimization) with FastAPI
- **Shared Package**: TypeScript types and utilities shared across packages

Full original codebase preserved on `snapshot/mako-poker-v1` branch.

## Development Commands

### Initial Setup
```bash
# Install dependencies
bun install

# Start PostgreSQL database
bun run db:start

# Push database schema (from apps/api directory)
cd apps/api && bun run db:push
```

### Running Services
```bash
# Start DB + API
bun run dev

# API only (http://localhost:8080)
bun run dev:api
```

### Database Management
```bash
# From apps/api directory:
bun run db:push       # Push schema changes
bun run db:generate   # Generate migrations
bun run db:studio     # Open Drizzle Studio GUI
```

### Testing
```bash
# Run all tests
bun test

# Run tests for specific workspace
cd apps/api && bun test

# Watch mode
bun test --watch
```

### Type Checking
```bash
# Check all workspaces
bun run typecheck

# Check specific workspace
cd apps/api && bun run typecheck
```

### Database Operations
```bash
bun run db:start   # Start PostgreSQL container
bun run db:stop    # Stop PostgreSQL container
bun run db:logs    # View database logs
```

## Architecture

### Monorepo Structure

This is a Bun workspace with two packages:
- `apps/api` - Elysia backend
- `packages/shared` - Shared TypeScript types and constants

The workspace uses path imports: `@mako/shared` imports from packages/shared.

### Backend Architecture (apps/api)

**Framework:** Elysia (Bun-native HTTP framework) with plugins for CORS and JWT auth.

**Services:**
- `auth-service.ts` - User authentication (JWT)
- `position-service.ts` - Position naming and ordering for GTO lookups

**Domain:**
- `hand-evaluator.ts` - Core poker hand evaluation
- `hand-rankings.ts` - Hand ranking data

**Database:**
- Uses Drizzle ORM with PostgreSQL
- Schema: `src/db/schema.ts`
- Tables: users, userRoles
- Connection managed by Drizzle, configured in `drizzle.config.ts`

**Routes:**
- `/auth/*` - Registration, login, user info
- `/health` - Health check endpoint

### Shared Package (packages/shared)

Contains types and constants used by the backend:
- `types/card.ts` - Card, Rank, Suit types and utilities
- `types/player.ts` - Player, Position, ActionType types
- `types/hand.ts` - Hand evaluation types
- `types/auth.ts` - Auth types
- `constants/game.ts` - Position name assignments by table size
- `constants/hand-eval.ts` - Hand evaluation constants
- `constants/rank.ts` - Rank constants

**Card Rank Convention:**
- All card ranks use **single-character representation**: `'2'`, `'3'`, `'4'`, `'5'`, `'6'`, `'7'`, `'8'`, `'9'`, `'T'`, `'J'`, `'Q'`, `'K'`, `'A'`
- Ten is represented as `'T'`, NOT `'10'`
- See `packages/shared/src/types/card.ts` for the canonical Rank type definition

### Python Solver (solver/)

**Purpose:** Provides GTO solving via CFR (Counterfactual Regret Minimization) algorithms.

**Structure:**
- `src/api/server.py` - FastAPI server exposing solver endpoints
- `src/cfr/` - CFR+ and Deep CFR implementations
- `src/game/` - Game state, card representation, hand evaluation
- `src/abstraction/` - Hand bucketing and action abstraction
- `src/training/` - Neural network training for Deep CFR
- `src/enums/` - Centralized enums (ActionTypeEnum, StreetEnum, etc.)

**Not currently integrated** with the main application but available for future GTO analysis features.

## Code Conventions

**CRITICAL**: All code must follow the comprehensive conventions in `.claude/coding-conventions.md`.

**Key Highlights:**
- **KISS is king** - Simplicity is the highest priority (prioritize over other principles when they conflict)
- **JavaScript/TypeScript**: Single quotes, no semicolons, use `==` not `===`, use `??` not `||`, max 80 chars/line
- **Methods**: Max 30-45 lines, no pure delegation, pass data not objects when only data is needed
- **Testing**: Use real implementations not mocks, `bun test`
- **Cleanup**: Remove all commented code, AI artifacts, and unused imports before submitting

See `.claude/coding-conventions.md` for complete rules including SOLID principles, naming conventions, error handling, and performance requirements.

## Environment Variables

**apps/api/.env:**
```bash
DATABASE_URL=postgresql://mako:mako@localhost:5432/mako
JWT_SECRET=your-secret-key-change-in-production
PORT=8080                           # Optional
CORS_ORIGIN=http://localhost:5173   # Optional
NODE_ENV=development                # Optional
```

## Common Gotchas

1. **Workspace Imports**: Use `@mako/shared` to import from packages/shared, not relative paths
2. **Position Logic**: Positions recalculate every hand based on dealer button rotation
3. **Card Ranks**: Always use `'T'` for ten, never `'10'` - all ranks must be single characters
