# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mako Poker is a GTO (Game Theory Optimal) poker training application with:
- **Frontend**: React with Vite, Tailwind CSS, Zustand state management
- **Backend**: Elysia (Bun) with PostgreSQL and Drizzle ORM
- **Solver**: Python CFR (Counterfactual Regret Minimization) with FastAPI
- **Shared Package**: TypeScript types and utilities shared between frontend and backend

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
# Start all services (DB + frontend + API)
bun run dev

# Start individual services
bun run dev:web    # Frontend only (http://localhost:5173)
bun run dev:api    # API only (http://localhost:8080)
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
cd apps/web && bun test

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

This is a Bun workspace with three main packages:
- `apps/web` - React frontend
- `apps/api` - Elysia backend
- `packages/shared` - Shared TypeScript types and constants

The workspace uses path imports: `@mako/shared` imports from packages/shared.

### Frontend Architecture (apps/web)

**State Management:**
- Zustand store (`src/store/gameStore.ts`) manages poker game state
- React Query (`@tanstack/react-query`) handles API calls
- Game state synchronizes with backend via REST API

**Key Directories:**
- `src/features/game/` - Main poker game UI components
- `src/features/game/hooks/` - Game-specific React hooks (auth, game actions, AI loop)
- `src/lib/` - Utilities (poker logic, Monte Carlo simulation)
- `src/components/` - Reusable UI components (shadcn/ui)
- `src/api/client.ts` - API client wrapper

**Routing:** Uses `wouter` for client-side routing.

### Backend Architecture (apps/api)

**Framework:** Elysia (Bun-native HTTP framework) with plugins for CORS and JWT auth.

**Service Layer Pattern:**
All game logic is implemented in services (`src/services/`), not routes:
- `game-service.ts` - Core game orchestration (start, deal, actions)
- `betting-service.ts` - Handles fold, call, raise, all-in logic
- `position-service.ts` - Position assignment and turn order
- `pot-service.ts` - Pot management and side pot calculations
- `showdown-service.ts` - Winner determination and chip distribution
- `street-service.ts` - Dealing flop/turn/river
- `ai-service.ts` - AI player decision making
- `auth-service.ts` - User authentication

**Game State:**
Games are stored in-memory in a `Map<string, InternalGameState>`. The `InternalGameState` type (in `domain/game-state.ts`) is the internal representation, which gets converted to the public `GameState` type (from `@mako/shared`) via `toGameStateDto()`.

**Database:**
- Uses Drizzle ORM with PostgreSQL
- Schema: `src/db/schema.ts`
- Tables: users, sessions, scenarios, recommendations, solver_cache, games
- Connection managed by Drizzle, configured in `drizzle.config.ts`

**Routes:**
- `/auth/*` - Registration, login, user info
- `/game/*` - Start game, deal, player actions, AI actions
- `/health` - Health check endpoint

### Shared Package (packages/shared)

Contains types and constants used by both frontend and backend:
- `types/` - TypeScript interfaces (GameState, Player, Card, etc.)
- `constants/game.ts` - Game defaults, timing, position names

**Key Type:** `GameState` is the central data structure representing the full poker game state, including players, pots, community cards, betting rounds, etc.

**Card Rank Convention:**
- All card ranks use **single-character representation**: `'2'`, `'3'`, `'4'`, `'5'`, `'6'`, `'7'`, `'8'`, `'9'`, `'T'`, `'J'`, `'Q'`, `'K'`, `'A'`
- Ten is represented as `'T'`, NOT `'10'`
- This ensures consistent single-character ranks across the entire codebase
- The `rankFromSymbol()` function accepts both `'T'` and `'10'` for backwards compatibility, but always returns `'T'`
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
- **Testing**: Use real implementations not mocks, `bun test` with happy-dom for frontend
- **Cleanup**: Remove all commented code, AI artifacts, and unused imports before submitting

See `.claude/coding-conventions.md` for complete rules including SOLID principles, naming conventions, error handling, and performance requirements.

## Important Implementation Details

### Game Flow

1. **Starting a Game**: `startGame()` creates `InternalGameState`, assigns positions, sets dealer button
2. **Dealing a Hand**: `dealHand()` resets players, deals hole cards, posts blinds, sets first to act
3. **Player Actions**: `submitPlayerAction()` validates action, updates state, checks if betting round complete
4. **AI Actions**: `processAiAction()` uses `ai-service.ts` to determine AI moves
5. **Street Progression**: When betting round completes, deal next street (flop/turn/river)
6. **Showdown**: When street is SHOWDOWN, determine winners and distribute chips

### Position System

The codebase uses a **seat-based** system:
- `seatIndex` - Physical seat at table (0-9)
- Player position names (BTN, SB, BB, UTG, etc.) assigned based on dealer button
- `assignPositions()` maps seat indices to position names
- Turn order determined by `getFirstToActPreflop()` and `findNextOccupiedSeat()`

### Pot Management

- `currentContributions` - Chips put in during current betting round
- `totalContributions` - Total chips put in during entire hand
- Side pots created when players go all-in with different stack sizes
- `calculatePots()` handles complex side pot scenarios

### Type Conversions

The API uses `InternalGameState` internally but returns `GameState` to clients:
- `createInternalGameState()` - Creates internal state
- `toGameStateDto()` - Converts internal state to public DTO
- This separation allows internal implementation details to differ from public API

## Environment Variables

**apps/api/.env:**
```bash
DATABASE_URL=postgresql://mako:mako@localhost:5432/mako
JWT_SECRET=your-secret-key-change-in-production
PORT=8080                           # Optional
CORS_ORIGIN=http://localhost:5173   # Optional
NODE_ENV=development                # Optional
```

## Database Schema Key Tables

- `users` - User accounts with email/password
- `games` - Persisted game state (currently using in-memory Map instead)
- `sessions` - Poker playing sessions for analytics
- `scenarios` - Individual hands for GTO analysis
- `recommendations` - Solver-generated GTO recommendations
- `solver_cache` - Cached CFR solutions

## Common Gotchas

1. **Workspace Imports**: Use `@mako/shared` to import from packages/shared, not relative paths
2. **Game State**: Always use `toGameStateDto()` when returning game state from API
3. **Position Logic**: Positions recalculate every hand based on dealer button rotation
4. **Betting Round Completion**: Use `isBettingRoundComplete()` to check if street should advance
5. **Player Indices**: Convert between `seatIndex` and `playerIndex` using position service helpers
6. **Card Ranks**: Always use `'T'` for ten, never `'10'` - all ranks must be single characters