---
title: "Poker Assistant - Mako Poker Codebase Assessment"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, mako, code-reuse, architecture, assessment]
related: [00-index, 02-architecture, 03-gto-engine, 10-data-model]
---

# Mako Poker Codebase Assessment

Repository: [github.com/JohnHuffman824/mako-poker](https://github.com/JohnHuffman824/mako-poker)

## Overview

Mako Poker is a **surprisingly mature** poker engine. It's a Bun monorepo with a React frontend, Elysia API, Python CFR solver, and ONNX inference bridge. The codebase is well-tested (500+ tests) and architecturally clean.

## What's Complete and Production-Ready

### Hand Evaluator (`apps/api/src/domain/hand-evaluator.ts`)
- 5-7 card evaluation with absolute ranking (1-7462)
- All hand types: Royal Flush through High Card
- Kicker comparison for ties
- Optimized for <1ms per evaluation
- **Reuse potential: HIGH** — core poker primitive, directly portable

### Betting Engine (`apps/api/src/services/betting-service.ts`)
- Full NL Hold'em betting rules
- Min/max raise validation
- All-in handling with side pots
- Betting round completion detection
- 518+ test cases for betting rules
- **Reuse potential: HIGH** — needed for hand validation and scenario parsing

### Pot Service (`apps/api/src/services/pot-service.ts`)
- Main pot + side pot calculation
- Per-player contribution tracking
- Eligibility computation for each pot
- **Reuse potential: MEDIUM** — useful for accurate pot calculations in scenarios

### Position Service (`apps/api/src/services/position-service.ts`)
- 2-10 player support
- Dynamic position naming (BTN, SB, BB, UTG, etc.)
- Heads-up special rules
- Dealer button rotation
- **Reuse potential: HIGH** — essential for parsing "I'm in the CO" type queries

### Shared Types (`packages/shared/`)
- Card, Player, GameState, Street, etc.
- Type-safe definitions shared across packages
- **Reuse potential: HIGH** — these become the API contract for the mobile app

### ONNX Inference Bridge (`packages/inference/`)
- TypeScript wrapper for ONNX Runtime
- StrategyModel class with `predict()` and `interpretOutput()`
- Hand bucketing (1326 → ~200 buckets)
- CPU and GPU execution provider support
- **Reuse potential: HIGH** — this is exactly what's needed for Tier 3 neural inference

### CFR Solver (`solver/`)
- Python CFR+ (tabular) — complete and tested
- Deep CFR (neural network) — implemented, needs training
- Hand bucketing and action abstraction
- ONNX export pipeline
- Kuhn poker validation (Nash equilibrium proof)
- **Reuse potential: HIGH** — this generates the precomputed GTO data

### JWT Auth (`apps/api/src/services/auth-service.ts`)
- Registration and login
- Token generation and validation
- Route protection middleware
- **Reuse potential: MEDIUM** — auth patterns transfer, but mobile auth may differ

## What's In Progress

### Deep CFR Training
- Architecture is implemented but needs actual training runs on GPU
- Requires significant compute (GPU rental or local GPU)
- Once trained, models export to ONNX for the inference bridge
- **Action needed**: Set up training pipeline, rent GPU time

### AI Service (`apps/api/src/services/ai-service.ts`)
- Dual-mode: ONNX model or fallback heuristics
- The fallback is basic probability-based decisions
- **Action needed**: Replace fallback with proper precomputed GTO lookups + Claude interpretation

## What's NOT Directly Reusable

### React Web Frontend (`apps/web/`)
- The web UI is a full poker game interface (table, cards, betting controls)
- The mobile app needs a completely different UI — chat-based, not game-based
- **However**: React component patterns, Zustand store patterns, and API client patterns are relevant

### Game Flow Orchestration (`apps/api/src/services/game-service.ts`)
- Manages a full poker game (deal, bet, show)
- The assistant app doesn't run games — it analyzes scenarios
- **Not needed** for the assistant, but could be useful for a future "practice mode"

### Database Schema (Drizzle ORM)
- Current schema is for game sessions and user accounts
- The assistant needs different tables (precomputed solutions, query history, presets)
- **Partially reusable** — user table and auth patterns transfer

## Recommended Extraction Plan

### Phase 1: Core Poker Library
Extract into a shared package that both Mako and the new app can use:
- Hand evaluator
- Card/Hand/Position types
- Betting validation rules
- Position system
- Pot calculations

### Phase 2: Solver Pipeline
Keep the Python solver as a standalone tool:
- Run training on GPU
- Export ONNX models
- Generate precomputed solution databases
- These feed into the assistant's GTO engine

### Phase 3: Inference Bridge
Port the ONNX inference package:
- Already TypeScript, works in Node/Bun
- May need adaptation for React Native (ONNX Runtime mobile)
- Or keep server-side only (simpler for MVP)

## Architecture Comparison

| Aspect | Mako Poker | Poker Assistant |
|--------|-----------|-----------------|
| Purpose | Play poker games | Analyze poker decisions |
| UI | Game table + cards | Chat + data display |
| Frontend | React (web) | React Native (mobile) |
| Backend | Elysia (Bun) | Elysia (Bun) — reuse |
| Database | PostgreSQL (Drizzle) | PostgreSQL — adapt schema |
| AI | ONNX inference | Claude + ONNX + precomputed |
| Solver | Python CFR | Same — generates data |
| Users | Playing poker | Studying poker |

## Key Takeaway

The Mako Poker codebase gives us:
1. **A working poker engine** — hand eval, betting, positions, pots
2. **A CFR solver** — can generate GTO data once trained
3. **An inference pipeline** — ONNX model → TypeScript predictions
4. **Shared types** — type-safe poker primitives
5. **Backend patterns** — Elysia + JWT + PostgreSQL

What we need to build new:
1. **LLM integration layer** — Claude API for parsing and interpretation
2. **Precomputed GTO database** — generated from solver runs
3. **Mobile app** — React Native chat interface
4. **Tournament GTO features** — ICM, push/fold, bubble math
5. **User experience layer** — presets, history, study mode
