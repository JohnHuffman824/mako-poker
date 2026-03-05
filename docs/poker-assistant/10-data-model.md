---
title: "Poker Assistant - Data Model & Storage"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, data-model, database, schema, storage]
related: [00-index, 02-architecture, 03-gto-engine, 07-mako-poker-assessment]
---

# Data Model & Storage

## Core Data Entities

### 1. Preflop Range Solutions

The primary GTO data store.

```
preflop_ranges
├── id (uuid)
├── position (enum: UTG, UTG1, MP, MP1, CO, BTN, SB, BB)
├── action_context (string: "open", "vs_utg_open", "vs_co_3bet", etc.)
├── stack_depth_bb (int: 10, 15, 20, 25, 30, 40, 50, 75, 100)
├── table_size (enum: "6max", "9max", "heads_up")
├── game_type (enum: "tournament", "cash")
├── ranges (jsonb: { "AKs": {"raise": 0.95, "fold": 0.05}, ... })
├── icm_adjusted (boolean)
├── source (string: "mako_solver", "curated", "texas_solver")
├── confidence (float: 0.0-1.0)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Query pattern**: Lookup by (position, action_context, stack_depth_bb, table_size, game_type).

**Index**: Composite index on the query columns for instant lookup.

**Estimated rows**: ~1000-2000 range tables.

### 2. Push/Fold Charts

Simplified all-in or fold decisions for short stacks.

```
push_fold_charts
├── id (uuid)
├── position (enum)
├── stack_depth_bb (int: 1-25)
├── table_size (enum)
├── num_players_remaining (int)
├── icm_pressure (enum: "none", "low", "medium", "high", "bubble")
├── ranges (jsonb: { "AA": "push", "AKs": "push", ... })
├── source (string)
└── created_at (timestamp)
```

### 3. User Accounts

```
users
├── id (uuid)
├── email (string, unique)
├── password_hash (string)
├── display_name (string)
├── subscription_tier (enum: "free", "basic", "pro")
├── queries_today (int, reset daily)
├── created_at (timestamp)
└── last_active_at (timestamp)
```

### 4. Session Presets

User-configured game contexts.

```
session_presets
├── id (uuid)
├── user_id (fk -> users)
├── name (string: "My Weekly MTT")
├── game_type (enum: "mtt", "sng", "satellite", "cash")
├── table_size (enum: "6max", "9max", "heads_up", "final_table")
├── stack_bb (int)
├── blind_level (string: "100/200/25")
├── players_remaining (int, nullable)
├── total_players (int, nullable)
├── payout_structure (jsonb, nullable)
├── is_default (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 5. Query History

Past questions and answers for the user.

```
query_history
├── id (uuid)
├── user_id (fk -> users)
├── preset_id (fk -> session_presets, nullable)
├── raw_question (text)
├── parsed_scenario (jsonb: structured poker scenario)
├── gto_result (jsonb: solver output)
├── llm_response (text: Claude's interpretation)
├── response_confidence (float)
├── data_tier (enum: "precomputed", "runtime", "neural")
├── tokens_used (int)
├── response_time_ms (int)
├── created_at (timestamp)
└── bookmarked (boolean, default false)
```

### 6. Study/Drill Results

Tracking quiz performance over time.

```
study_results
├── id (uuid)
├── user_id (fk -> users)
├── scenario_type (string: "preflop_open", "3bet_defense", "push_fold")
├── position (enum)
├── hand (string: "AQo")
├── correct_action (string: "raise")
├── user_action (string: "fold")
├── is_correct (boolean)
├── gto_frequencies (jsonb)
├── created_at (timestamp)
└── session_id (uuid, groups drills into sessions)
```

## Poker Scenario Schema

The structured representation of a poker situation, used for GTO lookups.

```typescript
interface PokerScenario {
  // Game context
  gameType: 'tournament' | 'cash';
  tournamentInfo?: {
    type: 'mtt' | 'sng' | 'satellite';
    totalPlayers: number;
    playersRemaining: number;
    payingPlaces: number;
    stage: 'early' | 'middle' | 'late' | 'bubble' | 'itm' | 'final_table';
  };

  // Table context
  tableSize: 6 | 9 | 2;
  activePlayers: number;

  // Hero
  hero: {
    position: Position;
    stackBB: number;
    hand: string;       // "AQo", "KJs", "88", etc.
  };

  // Action so far
  street: 'preflop' | 'flop' | 'turn' | 'river';
  board?: string[];     // ["Ks", "7h", "2d"] for flop+
  actions: Array<{
    position: Position;
    action: 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'allin';
    amount?: number;    // In BB
  }>;

  // What the user wants to know
  questionType: 'action_decision' | 'equity_check' | 'range_query' | 'hand_review';
}
```

## Reusable Types from Mako Poker

From `packages/shared/`:
```typescript
// Card representation
interface Card {
  rank: RankChar;  // '2'-'9', 'T', 'J', 'Q', 'K', 'A'
  suit: Suit;      // 'hearts', 'diamonds', 'clubs', 'spades'
}

// Hand result from evaluator
interface HandResult {
  absoluteRank: number;   // 1-7462
  handType: HandType;
  cards: Card[];
  description: string;
}

type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG1' | 'MP' | 'MP1' | 'CO';
type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
```

## Database Choice

**PostgreSQL** with Drizzle ORM (matches Mako Poker stack).

Reasons:
- JSONB support for flexible range data and scenario storage
- Excellent indexing for lookup queries
- Familiar from Mako codebase
- Drizzle ORM reuse
- Managed hosting available everywhere (Neon, Supabase, RDS)

### Caching Layer (Post-MVP)

For frequently-queried ranges:
- **Redis** or **in-memory cache** for hot preflop lookups
- Most preflop queries will hit the same ~50 scenarios repeatedly
- Cache Claude parse results for identical/similar questions
- Cache Claude interpretation results for identical solver outputs

## Storage Estimates

| Data | Size Estimate |
|------|--------------|
| Preflop ranges (1000-2000 tables) | ~5-20 MB |
| Push/fold charts | ~2-5 MB |
| User data (per user) | ~1 KB |
| Query history (per query) | ~2-5 KB |
| Study results (per drill) | ~0.5 KB |
| **Total for 1000 users, 1 year** | **~1-5 GB** |

Very manageable. Storage is not a constraint.
