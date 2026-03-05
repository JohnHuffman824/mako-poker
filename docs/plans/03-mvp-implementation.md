---
title: "Plan 3: MVP Implementation"
type: plan
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, plan, mvp, implementation, mobile, llm, gto]
related: [poker-assistant/00-index, poker-assistant/01-vision, poker-assistant/02-architecture, poker-assistant/09-mvp-definition, 01-repo-cleanup, 02-ai-infrastructure]
---

# Plan 3: MVP Implementation

> Build the Poker Assistant MVP — a mobile-first conversational GTO coach powered by precomputed solver data and Claude interpretation.

## Goal

Deliver the core value proposition defined in [[poker-assistant/01-vision]]: ask poker questions in plain English, get solver-backed answers with natural language explanations. Scope is preflop-only for v0.1 per [[poker-assistant/09-mvp-definition]].

## Prerequisites

- [[01-repo-cleanup]] complete (clean codebase)
- [[02-ai-infrastructure]] complete (development tooling in place)

## Architecture Overview

Three-layer system per [[poker-assistant/02-architecture]]:

```
Mobile App (Expo/React Native)
    |
    v
Backend API (Bun + Elysia)
    |
    +-- Claude API (parse + interpret)
    +-- Preflop Lookup DB (PostgreSQL)
    +-- Equity Calculator (runtime)
```

Two Claude calls per query ([[poker-assistant/04-llm-rag-layer]]):
1. **Parse** — natural language -> structured PokerScenario
2. **Interpret** — GTO solver output -> natural language explanation

## Phase 1: GTO Data Foundation

Build the precomputed range database that backs all recommendations. This is the "truth" layer — Claude never generates these numbers.

### 1.1: Preflop Range Database Schema

Implement the data model from [[poker-assistant/10-data-model]]:
- `preflop_ranges` table with position, action_context, stack_depth, table_size, ranges (JSONB)
- `push_fold_charts` table for short-stack decisions
- Composite indexes for instant lookups
- Drizzle ORM schema and migrations

### 1.2: Seed Preflop Data

Populate the database with preflop GTO solutions:
- Opening ranges by position for 9 stack depths x 8 positions x 2 table sizes
- 3-bet ranges vs each position
- Push/fold charts for 1-25BB
- ~800-1000 range tables total per [[poker-assistant/09-mvp-definition#MVP Data Requirements]]
- Source: Mako CFR solver runs and/or curated from established GTO sources

### 1.3: GTO Query Engine

Service layer for looking up and interpolating GTO data:
- `lookupPreflopRange(position, actionContext, stackBB, tableSize)` — exact match or nearest bucket
- `lookupPushFoldChart(position, stackBB, tableSize, icmPressure)` — push/fold decision
- Stack depth interpolation between precomputed buckets
- Confidence scoring (exact match = high, interpolated = medium)

### 1.4: Equity Calculator

Runtime computation for Tier 2 queries ([[poker-assistant/03-gto-engine#Tier 2]]):
- Hand vs hand equity
- Hand vs range equity (Monte Carlo)
- Target: <500ms for range vs range
- Reuse Mako's hand evaluator as foundation

## Phase 2: Claude LLM Integration

The two-phase LLM layer per [[poker-assistant/04-llm-rag-layer]].

### 2.1: Scenario Parsing (Claude Call #1)

Claude extracts structured data from natural language:
- Define `PokerScenario` TypeScript interface ([[poker-assistant/10-data-model#Poker Scenario Schema]])
- Claude tool use / function calling to extract: position, hand, stack, action sequence, tournament context
- Handle ambiguity (ask clarifying questions)
- Handle poker shorthand ("ace queen off", "the button", "standard open")
- Test with 30+ sample queries to validate accuracy

### 2.2: Strategy Interpretation (Claude Call #2)

Claude explains GTO recommendations:
- System prompt engineering per [[poker-assistant/04-llm-rag-layer#Interpretation Prompt Engineering]]
- Input: user's question + structured solver output
- Output: natural language explanation with strategic reasoning
- Rules: never invent numbers, explain WHY, adjust for skill level, cite confidence
- Confidence level communication (high/medium/lower per [[poker-assistant/03-gto-engine#Confidence Levels]])

### 2.3: Conversation Management

- Session context persistence (preset configuration carries across queries)
- Multi-turn conversation support for hand reviews
- Token budget management
- Cost optimization: Haiku for simple parses, Sonnet for interpretation

### 2.4: Claude Tool Definitions

Define tools Claude can call during parsing ([[poker-assistant/04-llm-rag-layer#RAG Architecture Options|Tool Use approach]]):
- `lookup_preflop_range` — query precomputed ranges
- `calculate_equity` — runtime equity calculation
- `get_push_fold_chart` — short-stack decision lookup
- (Future: `compute_icm`, `lookup_postflop`)

## Phase 3: Backend API

New API routes for the Poker Assistant.

### 3.1: Query Endpoint

`POST /query` — the main endpoint:
1. Receive natural language question + session context
2. Call Claude to parse into PokerScenario
3. Query GTO engine for solver data
4. Call Claude to interpret results
5. Return response with recommendation + explanation + confidence

### 3.2: Session Preset Endpoints

Per [[poker-assistant/10-data-model#4. Session Presets]]:
- `POST /presets` — create preset
- `GET /presets` — list user's presets
- `PUT /presets/:id` — update preset
- `DELETE /presets/:id` — delete preset
- `POST /presets/:id/activate` — set as active

### 3.3: Query History Endpoints

Per [[poker-assistant/10-data-model#5. Query History]]:
- `GET /history` — list past queries (paginated)
- `GET /history/:id` — single query detail
- `POST /history/:id/bookmark` — bookmark a query

### 3.4: Streaming Support

Stream Claude's interpretation response for better perceived latency:
- SSE (Server-Sent Events) for the interpretation phase
- Show recommendation immediately, stream explanation
- Target: first meaningful content in <2 seconds

## Phase 4: Mobile App

React Native / Expo app per [[poker-assistant/05-cross-platform-mobile]] and [[poker-assistant/06-ux-design]].

### 4.1: Expo Project Setup

- Initialize Expo project (in `apps/mobile/` or separate repo — TBD)
- Configure Expo Router for file-based navigation
- Set up shared types via `@mako/shared`
- Configure expo-secure-store for JWT storage

### 4.2: Auth Screens

- Login screen
- Registration screen
- JWT token management
- Auth guard on protected routes

### 4.3: Chat Interface (Home Screen)

The primary screen per [[poker-assistant/06-ux-design#1. Home / Quick Query]]:
- Chat-style message flow
- Active preset bar at top
- Text input with send button
- Response display with action + frequency prominently shown
- "Show Details" expandable section
- Streaming text display for Claude responses

### 4.4: Preset Configuration Screen

Per [[poker-assistant/06-ux-design#2. Preset Configuration]]:
- Game type, format, table size selectors
- Stack size input
- Players remaining / pay structure
- Save/load preset functionality
- Quick-apply from preset list

### 4.5: Profile / History Screen

Per [[poker-assistant/06-ux-design#5. Profile / History]]:
- Query history list
- Bookmarked queries
- Basic stats (queries today, streak)
- Settings and subscription management (stub for MVP)

## Phase 5: Integration & Polish

### 5.1: End-to-End Testing

Full flow verification:
- User types question -> parse -> lookup -> interpret -> display
- Preset context flows correctly into queries
- Auth flow works on both platforms
- History persists correctly

### 5.2: Performance Optimization

Targets from [[poker-assistant/05-cross-platform-mobile#Performance Targets]]:
- App launch: < 2 seconds
- Quick query response: < 5 seconds
- UI interactions: 60fps
- Bundle size: < 50MB

### 5.3: Error Handling

- Claude API failures (fallback messaging)
- Network errors (offline state)
- Invalid/unparseable queries (graceful error + retry suggestion)
- Rate limiting (free tier: 5 queries/day)

### 5.4: Beta Testing

- TestFlight for iOS
- Internal Testing for Android
- Validate with real poker questions
- Iterate on prompt engineering based on real usage

## Success Criteria

From [[poker-assistant/09-mvp-definition#Success Criteria]]:

- [ ] Can ask "Is AQo a 3-bet from the CO vs UTG open at 20BB in a tournament?" and get a correct, well-explained answer
- [ ] Response time < 5 seconds
- [ ] Works on both iOS and Android
- [ ] Can save and switch between session presets
- [ ] Handles at least the 50 most common preflop questions accurately
- [ ] Solver data is never hallucinated — all numbers come from precomputed DB
- [ ] Claude provides clear "why" explanations, not just "what"

## Estimated Scope

| Phase | Complexity | Notes |
|-------|-----------|-------|
| Phase 1: GTO Data | Medium | Largest unknown is sourcing quality range data |
| Phase 2: Claude Integration | Medium | Prompt engineering is iterative |
| Phase 3: Backend API | Low-Medium | Builds on existing Elysia patterns |
| Phase 4: Mobile App | Medium-High | New platform (React Native), most UI work |
| Phase 5: Integration | Low-Medium | Polish and edge cases |

## Dependencies

- **Depends on**: [[01-repo-cleanup]], [[02-ai-infrastructure]]
- **External**: Claude API access, preflop GTO data sourcing, Apple/Google developer accounts for app store submission

## Open Questions

Carried from [[poker-assistant/12-research-topics]]:
- Which solver to use for generating preflop data?
- How many stack depth buckets to precompute?
- Haiku vs Sonnet accuracy for parsing?
- Expo managed vs bare workflow?
- Separate repo for mobile app or same monorepo?
