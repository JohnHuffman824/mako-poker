---
title: "Poker Assistant - Competitor Analysis"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, competitors, gto-wizard, piosolver, market-analysis]
related: [00-index, 01-vision, 09-mvp-definition]
---

# Competitor Analysis

## Tier 1: Market Leaders

### GTO Wizard
**The dominant player.** Web-based solver with 10M+ pre-solved scenarios.

- **Pricing**: Free tier → $39/mo (Basic) → $89/mo (Premium) → $206/mo (Ultra)
- **Tech**: Neural network + depth-limited solving. Solutions generated in ~3 seconds per street. Precomputed database for common spots.
- **Strengths**: Massive solution database, training modes, clean UI, practice drills
- **Weaknesses**: Expensive, steep learning curve, mostly heads-up, no natural language, not truly mobile-native (web-based with mobile browser support)
- **Recent**: Launched multiway preflop solving (Feb 2026)

**What to learn from**: Their training/drill mode is excellent. Their precomputed database approach proves the model works.

**Where we differentiate**: Natural language interface, mobile-native, affordable, tournament-focused.

### PioSolver
**The gold standard for serious players.** Desktop postflop solver.

- **Pricing**: $249 (Pro) / $549 (Edge) one-time
- **Tech**: Pure CFR solver running on local hardware. Edge version needs 64GB+ RAM.
- **Strengths**: Most accurate postflop solver, full customization, nodelocking for exploitative play
- **Weaknesses**: Desktop-only (Windows), requires powerful hardware, steep learning curve, heads-up only, zero mobile presence, manual scenario setup
- **Target**: Professional and semi-pro players

**What to learn from**: Accuracy standard to aim for. Nodelocking concept (exploitative adjustments on top of GTO).

**Where we differentiate**: Everything — mobile, accessible, affordable, conversational.

## Tier 2: Specialized Tools

### GTO+
- $75 one-time. Budget PioSolver alternative.
- Supports multiway pots (PioSolver doesn't)
- Desktop-only, technical interface
- **Relevance**: Multiway support is a feature gap we could fill

### HRC (Holdem Resources Calculator)
- $10-30/mo. Tournament push/fold specialist.
- Best ICM calculator for late-stage tournaments
- Push/fold Nash ranges with ICM adjustments
- **Relevance**: Core competitor for our tournament focus. Their ICM math is what we'd replicate.

### ICMIZER
- $8-18/mo. Professional ICM analysis.
- Nash equilibrium calculations for tournaments
- Mobile add-on (SNG Coach) at $95.88/yr extra
- **Relevance**: Proves there's demand for tournament ICM tools on mobile

### Flopzilla Pro
- $25-49 one-time. Range analysis / board texture tool.
- Excellent for understanding how ranges hit boards
- Windows-only, not a solver
- **Relevance**: Range visualization concepts worth borrowing

## Tier 3: Mobile Apps

### GTO Gecko ($15-40/mo)
- Most feature-rich mobile solver
- Preflop + postflop + training + stats
- 4.63 stars on app stores
- **Relevance**: Closest existing competitor to what we're building (minus the conversational AI)

### GTO Sensei
- 5B+ training scenarios
- Interactive training mimicking real play
- iOS and Android
- **Relevance**: Training mode concept is strong

### Postflop+
- Works fully offline
- ELO rating system and leaderboards
- 15K+ active players, lifetime purchase option
- **Relevance**: Proves mobile GTO training can work. Social features interesting.

### Poker Coach+ (NEW - Emerging)
- iOS, free. LLM-based conversational coaching.
- Natural language hand analysis + mental game support
- 5.0 stars but tiny user base
- **Relevance**: DIRECT competitor for the conversational AI concept. But thin wrapper around generic LLM — no solver integration. This is what we'd do 10x better.

### PokerOS (NEW - Emerging)
- iOS. "World's first AI Poker Coach"
- Personalized AI models, very early stage
- ~100 users
- **Relevance**: Another LLM-based coaching app. Validates the concept but doesn't have solver backing.

## Market Gaps (Our Opportunities)

### 1. Natural Language Interface (BIGGEST GAP)
No tool lets you describe a hand in plain English and get a solver-backed answer. Poker Coach+ and PokerOS try but use generic LLMs without deep GTO integration. We would be the first to combine conversational AI with actual solver data.

### 2. Mobile-First, Native Experience
Desktop tools dominate. Existing mobile apps are limited training tools or browser ports. No native mobile app combines solving + training + hand analysis + coaching.

### 3. Tournament-Specific GTO
No affordable mobile app covers the full tournament spectrum: ICM, bubble play, pay jumps, PKO adjustments, push/fold, final table dynamics, deal equity.

### 4. Affordable Pricing
GTO Wizard is $39-206/mo. Massive recreational player base is priced out. A freemium model at $10-20/mo with generous free tier could capture huge volume.

### 5. Exploitative + GTO Hybrid (Future)
No tool automatically layers population-level exploits on top of GTO baselines. "Here's the GTO play, but against typical 1/2 players, you should actually..."

### 6. Progressive Onboarding
Every tool assumes GTO knowledge. No tool adapts difficulty and teaches the "why" gradually from beginner through advanced.

## Competitive Positioning

```
                    Technical Depth
                         ▲
                         │
         PioSolver ●     │     ● GTO Wizard
                         │
                         │
         GTO+ ●          │     ● HRC
                         │
                         │
    ─────────────────────┼──────────────────► Accessibility
                         │
                         │
         Flopzilla ●     │    ● GTO Gecko
                         │
                         │
    Poker Coach+ ●       │    ★ US (target)
                         │
                         │
```

We're targeting the **bottom-right quadrant** — high accessibility, moderate-to-good technical depth. We don't need PioSolver accuracy. We need "good enough GTO" with "best-in-class accessibility."

## Pricing Strategy Ideas

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 5 queries/day, basic preflop ranges, no study mode |
| Basic | $9.99/mo | 50 queries/day, full preflop, basic postflop, study mode |
| Pro | $19.99/mo | Unlimited queries, full postflop, ICM, hand history, coaching |
| Annual | $149.99/yr | Pro features, ~$12.50/mo |

Key: Significantly cheaper than GTO Wizard while providing the conversational experience they don't have.
