---
title: "Poker Assistant - System Architecture"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, architecture, system-design, llm, gto]
related: [00-index, 03-gto-engine, 04-llm-rag-layer, 05-cross-platform-mobile, 10-data-model]
---

# System Architecture

## High-Level Overview

Three-layer architecture:

```
┌─────────────────────────────────────────────┐
│              Mobile App (UI)                │
│         React Native / Expo                  │
│   Quick Query │ Hand Review │ Study Mode     │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│             Backend API                      │
│                                              │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Claude LLM  │  │   GTO Query Engine  │  │
│  │  (Interpret)  │──│  (Solver Data)      │  │
│  └──────────────┘  └─────────────────────┘  │
│                                              │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  User/Session│  │  Precomputed DB     │  │
│  │  Management  │  │  (GTO Solutions)    │  │
│  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Layer 1: Mobile App (Client)

See [[05-cross-platform-mobile]] for platform details and [[06-ux-design]] for UI design.

- Cross-platform via React Native or Expo
- Handles user input (natural language + structured scenarios)
- Renders results (recommendations, range charts, EV data)
- Manages session presets and hand history
- All computation happens server-side (online-only for MVP)

## Layer 2: Backend API

The orchestration layer that ties everything together.

### Request Flow

```
User Question (natural language)
    │
    ▼
┌─────────────────────────┐
│  NLP Parser / Claude     │
│  - Extract: cards, pos,  │
│    action, stack, board   │
│  - Identify query type    │
│  - Determine what GTO     │
│    data is needed         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  GTO Query Engine        │
│  - Lookup precomputed    │
│    solution              │
│  - OR run runtime calc   │
│    (equity, ICM, etc.)   │
│  - Return structured     │
│    solver output         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Claude Interpretation   │
│  - Translate solver      │
│    output to English     │
│  - Add strategic context │
│  - Explain WHY, not      │
│    just WHAT             │
└───────────┬─────────────┘
            │
            ▼
    Response to App
```

### Key Insight: Two Claude Calls

The LLM is used twice in each query:
1. **Parsing** — extract structured poker data from natural language input
2. **Interpretation** — translate structured solver output back to natural language

The actual GTO computation happens between these two calls using deterministic, accurate solver data. The LLM never does the math.

### Backend Tech Stack Options

| Option                              | Pros                                                          | Cons                                      |
| ----------------------------------- | ------------------------------------------------------------- | ----------------------------------------- |
| **Bun + Elysia** (from Mako)        | Familiar, fast, type-safe, reuse existing code                | Less mature ecosystem for mobile backends |
| **Node + Express/Fastify**          | Massive ecosystem, well-documented                            | Slower than Bun                           |
| **Python + FastAPI**                | Closer to solver code (Python), ML ecosystem                  | Two languages if frontend is TS           |
| **Bun API + Python solver service** | Best of both — TS API layer, Python for heavy GTO computation | More complex deployment                   |

**Leaning toward**: Bun + Elysia for the API (reuse Mako code), with Python microservice for heavy solver computation when needed.

## Layer 3: GTO Data Layer

See [[03-gto-engine]] for full details.

Three tiers of GTO data, in order of preference:

### Tier 1: Precomputed Solutions Database
- Pre-solved common spots (preflop ranges, standard postflop scenarios)
- Instant lookup, highest accuracy
- Stored in PostgreSQL or a purpose-built lookup structure
- Covers ~80% of user queries

### Tier 2: Runtime Computation
- Equity calculations, ICM math, push/fold charts
- Runs in real-time for custom scenarios
- Lightweight enough for per-request computation
- Covers ~15% of user queries

### Tier 3: Neural Network Inference
- ONNX model from trained Deep CFR solver
- For novel postflop spots not in precomputed DB
- Slower but still feasible for on-demand use
- Covers ~5% of edge-case queries

## Infrastructure Considerations

### Hosting
- Backend API: Cloud server (AWS, GCP, or Fly.io for simplicity)
- Database: Managed PostgreSQL
- Claude API: Anthropic cloud (no self-hosting needed)
- Solver service: Could be a separate container for heavy computation

### Scalability (later concerns, not MVP)
- Precomputed DB is read-heavy — cache aggressively
- Claude API calls are the latency bottleneck (~1-3 seconds each)
- Two Claude calls per query means ~2-6 seconds total response time
- Consider streaming responses to improve perceived latency

### Cost Drivers
- Claude API usage (per-token pricing)
- Server hosting
- Database storage for precomputed solutions
- ONNX model inference compute (if used)

## Security

- JWT authentication for users
- Rate limiting on API and Claude calls
- No sensitive poker hand data shared publicly
- API keys stored server-side only

## What Can Be Reused from Mako Poker

See [[07-mako-poker-assessment]] for full breakdown. Key architectural reuse:
- Elysia API patterns and JWT auth
- Hand evaluation engine
- Betting validation logic
- Card/game type definitions (`@mako/shared`)
- ONNX inference bridge
- CFR solver (Python) for generating precomputed solutions
