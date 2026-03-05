---
title: "Poker Assistant - MVP Definition"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, mvp, roadmap, planning, scope]
related: [00-index, 01-vision, 02-architecture, 03-gto-engine]
---

# MVP Definition

Scope: Side project, iterate slowly. Build the smallest thing that delivers the core value proposition — ask poker questions in plain English, get solver-backed answers.

## MVP Core Features

### Must Have (v0.1)

1. **Chat interface** — type a poker question, get an answer
2. **Preflop GTO lookups** — opening ranges, 3-bet ranges, push/fold charts by position and stack depth
3. **Claude parsing** — extract structured data from natural language
4. **Claude interpretation** — explain GTO recommendations in plain English
5. **Session presets** — configure tournament type, stack size, table size
6. **Basic auth** — sign up, log in, persist data
7. **Cross-platform** — iOS and Android via React Native/Expo

### Nice to Have (v0.2)

8. **Equity calculator** — hand vs hand/range equity
9. **ICM calculations** — bubble factor, push/fold with ICM
10. **Hand review mode** — walk through a full hand
11. **Study/drill mode** — quiz on GTO decisions
12. **Query history** — view past questions and answers

### Later (v0.3+)

13. **Postflop GTO** — c-bet spots, facing bets, turn/river play
14. **Range chart visualization** — visual range grids
15. **Leak tracking** — identify patterns in your incorrect answers
16. **ONNX neural inference** — for novel postflop spots
17. **Voice input** — ask questions hands-free
18. **Exploitative adjustments** — population tendencies on top of GTO

## MVP Architecture (Simplified)

```
Mobile App (Expo/RN)
    │
    ▼
Backend API (Bun + Elysia)
    │
    ├── Claude API (parse + interpret)
    ├── Preflop Lookup DB (PostgreSQL)
    └── Equity Calculator (runtime)
```

For MVP, skip:
- ONNX inference (complex, not needed for preflop)
- Postflop solver (huge precompute effort)
- Vector RAG (tool use is sufficient)

## MVP Tech Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Mobile | Expo + React Native | Cross-platform, TS sharing, familiar |
| Backend | Bun + Elysia | Reuse from Mako, fast, type-safe |
| Database | PostgreSQL | Preflop ranges + user data |
| LLM | Claude API (Anthropic) | Familiar, good at structured extraction |
| Auth | JWT (reuse Mako pattern) | Simple, proven |
| Hosting | Fly.io or Railway | Simple deployment, good free tiers |

## MVP Data Requirements

### Preflop Solution Database

What we need to precompute/curate for MVP:

**Opening ranges** (per position, per stack depth):
- Positions: UTG, UTG+1, MP, MP+1, CO, BTN, SB, BB (8)
- Stack depths: 10BB, 15BB, 20BB, 25BB, 30BB, 40BB, 50BB, 75BB, 100BB+ (9)
- Table sizes: 6-max, 9-max (2)
- = ~144 range tables

**Facing opens** (3-bet, call, fold frequencies):
- Each position vs each earlier position
- Per stack depth
- = ~500+ range tables

**Push/fold charts**:
- Per position, per stack depth (1-25BB)
- With and without ICM adjustments
- = ~200 charts

**Total**: ~800-1000 range tables. This is very manageable.

### Where to Get This Data

1. **Run Mako's CFR solver** on preflop-only scenarios (fastest path)
2. **Curate from public sources** — many training sites publish standard ranges
3. **Use open-source solvers** — TexasSolver can generate preflop data
4. **Combination** — bootstrap with curated data, validate and refine with solver

## Phased Roadmap

### Phase 0: Foundation (Weeks 1-4)
- [ ] Set up Expo project with basic navigation
- [ ] Set up backend API (fork/adapt from Mako)
- [ ] Implement Claude integration (parse + interpret)
- [ ] Build preflop lookup database (start with curated ranges)
- [ ] Basic chat UI

### Phase 1: MVP (Weeks 5-8)
- [ ] Session preset configuration
- [ ] Preflop range queries working end-to-end
- [ ] Push/fold charts with ICM awareness
- [ ] User auth and data persistence
- [ ] Polish chat UX
- [ ] TestFlight / Internal testing

### Phase 2: Enhancement (Weeks 9-16)
- [ ] Equity calculator integration
- [ ] Full ICM calculations
- [ ] Hand review mode
- [ ] Study/drill mode
- [ ] Query history and bookmarks
- [ ] App Store / Play Store submission

### Phase 3: Postflop + Advanced (Ongoing)
- [ ] Postflop precomputed solutions (common spots)
- [ ] ONNX neural inference for novel spots
- [ ] Range chart visualization
- [ ] Leak tracking
- [ ] Voice input
- [ ] Subscription/payment integration

## Success Criteria for MVP

- Can ask "Is AQo a 3-bet from the CO vs UTG open at 20BB in a tournament?" and get a correct, well-explained answer
- Response time < 5 seconds
- Works on both iOS and Android
- Can save and switch between session presets
- Handles at least the 50 most common preflop questions accurately

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude hallucinates strategy | Medium | High | Never let LLM generate numbers — only interpret solver data |
| Preflop data quality | Low | High | Cross-reference multiple sources, validate with solver |
| Claude API costs too high | Medium | Medium | Cache aggressively, use Haiku for simple parses |
| App Store rejection | Low | Medium | We're education, not gambling. No real money involved |
| Scope creep | High | Medium | Strict MVP definition. Preflop only for v0.1 |
| React Native performance | Low | Low | App is chat + data, not graphics-heavy |
