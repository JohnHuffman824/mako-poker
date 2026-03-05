---
title: "Poker Assistant - Research Topics & Open Questions"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, research, open-questions, investigation]
related: [00-index, 03-gto-engine, 04-llm-rag-layer, 11-tournament-gto]
---

# Research Topics & Open Questions

Things to investigate before and during development. Organized by domain.

## GTO Engine & Solver

### Which solver to use for precomputing data?
- **Mako CFR solver** — already built, but needs GPU training
- **TexasSolver** (C++) — open source, fast, well-tested
- **WASM Postflop** (Rust/WASM) — proven in browser, near-PioSolver accuracy at ~2x slower
- **OpenSolver** (Rust) — newer open-source option
- **Noam Brown's poker_solver** — from Meta AI (created Pluribus)
- [ ] Benchmark accuracy of each against PioSolver for standard spots
- [ ] Evaluate training time / compute requirements
- [ ] Can we use multiple solvers for cross-validation?

### Precomputed database scope
- [ ] How many stack depth buckets? Every BB? Every 5BB? Every 10BB?
- [ ] How many action sequences to cover preflop? (open, vs open, vs 3bet, vs 4bet)
- [ ] How much postflop coverage for MVP? (none? just c-bet spots?)
- [ ] What's the storage size for comprehensive preflop coverage?
- [ ] How to handle interpolation between precomputed stack depths?

### Solver accuracy vs. speed tradeoffs
- [ ] How many CFR iterations are "good enough" for our target audience?
- [ ] PioSolver converges in ~50-200 iterations. What does our solver need?
- [ ] Abstraction quality vs. solution accuracy (more hand buckets = better but slower)

### Open-source GTO data
- [ ] Are there public datasets of GTO solutions we can use as a starting point?
- [ ] Free solver tools that output range data (PokerStove, Equilab) — can we scrape/import?
- [ ] Academic papers with published equilibrium strategies?

## LLM & Claude Integration

### Parsing accuracy
- [ ] How well does Claude extract structured poker data from natural language?
- [ ] What's the error rate? (e.g., confusing positions, misreading hand notation)
- [ ] Should we use tool use / function calling or structured output?
- [ ] Do we need a fine-tuned model for poker NLP, or is prompt engineering sufficient?

### Preventing hallucination
- [ ] How to ensure Claude never invents strategy numbers?
- [ ] What prompt engineering patterns work best for "interpret only, don't generate"?
- [ ] Should we include a verification step (cross-check LLM output against solver data)?
- [ ] How to handle cases where the user asks something the data doesn't cover?

### Cost optimization
- [ ] Claude Haiku vs Sonnet for parsing — is Haiku accurate enough?
- [ ] Average tokens per query (parsing + interpretation)?
- [ ] Caching strategies for repeated/similar questions
- [ ] Can we precompute Claude explanations for the 100 most common questions?

### Conversation management
- [ ] How to maintain context across a multi-turn hand review?
- [ ] Token budget for conversation history?
- [ ] When to summarize context vs. include full history?
- [ ] How to detect and handle user skill level for explanation depth?

## Mobile & Cross-Platform

### React Native / Expo
- [ ] ONNX Runtime compatibility with React Native (if we ever need on-device inference)
- [ ] Expo managed vs. bare workflow — do we need anything that requires ejection?
- [ ] Push notification strategy for study reminders
- [ ] App size targets (initial download < 50MB)

### App Store compliance
- [ ] Does this qualify as Education or Reference category?
- [ ] Any issues with poker content in App Store review?
- [ ] In-App Purchase integration for subscriptions (Apple/Google take 30%/15%)
- [ ] How do competitors (GTO Gecko, Postflop+) handle App Store categorization?

## Tournament GTO Specifics

### ICM implementation
- [ ] Which ICM model to use? (Malmuth-Harville vs. Monte Carlo ICM)
- [ ] Performance for large field calculations (100+ players)?
- [ ] How to handle approximate ICM for pre-bubble play?
- [ ] PKO bounty adjustment formulas?

### Push/fold data
- [ ] Best source for precomputed Nash push/fold ranges?
- [ ] How to adjust for antes vs. no antes?
- [ ] BB ante vs. traditional ante adjustments?
- [ ] Short-stack vs. medium-stack push/fold boundary (where to switch from push/fold to open-raise)?

### Tournament stage detection
- [ ] Can we infer tournament stage from user-provided data? (players remaining, pay structure)
- [ ] How to handle missing information (user doesn't know exact pay structure)?
- [ ] Default assumptions for common tournament types (Sunday Major, $50 MTT, etc.)

## Business & Product

### Monetization
- [ ] Freemium conversion rates in poker app market?
- [ ] Apple/Google 30% cut on subscriptions — how does this affect pricing?
- [ ] Claude API cost per user per month — can we sustain the margins?
- [ ] Would a token/credit system work better than unlimited queries?

### User acquisition
- [ ] Poker forums and communities for beta testing (2+2, Reddit r/poker, etc.)
- [ ] Influencer/streamer marketing potential?
- [ ] SEO for "poker GTO app" "poker coach app" etc.
- [ ] Free tier as funnel — how generous to be?

### Legal
- [ ] Any gambling regulations that apply to strategy tools?
- [ ] Disclaimer requirements ("this is for educational purposes")?
- [ ] Data privacy for hand history storage (GDPR, etc.)
- [ ] Intellectual property — can GTO ranges be copyrighted?

## Technical Infrastructure

### Backend hosting
- [ ] Fly.io vs Railway vs Render vs AWS for backend deployment
- [ ] Managed PostgreSQL options (Neon, Supabase, RDS)
- [ ] CDN needs for mobile API?
- [ ] Rate limiting strategy for free vs paid tiers

### Monitoring
- [ ] Error tracking (Sentry?)
- [ ] Analytics (PostHog, Mixpanel?)
- [ ] Claude API usage monitoring and alerts
- [ ] Response time tracking

## Next Steps

Priority research (do first):
1. **Claude parsing accuracy** — test with 20-30 sample poker questions
2. **Preflop data sourcing** — find or generate range tables for the top 100 scenarios
3. **React Native/Expo spike** — build a basic chat UI to prove the mobile stack
4. **ICM library** — find or build a fast ICM calculator

Everything else can be researched as needed during development.
