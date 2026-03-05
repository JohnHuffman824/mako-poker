---
title: "Poker Assistant - Vision & Concept"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, gto, vision, product-concept]
related: [00-index, 08-competitor-analysis, 09-mvp-definition]
---

# Vision & Concept

## The Problem

Existing GTO poker tools are:
1. **Too complex** — steep learning curve, require understanding solver output formats and range matrices
2. **Not conversational** — can't ask questions in plain English
3. **Not mobile-friendly** — desktop-first, poor phone experience
4. **Expensive** — GTO Wizard is $39-206/mo, PioSolver is $249-549 one-time
5. **Study-only** — not designed for quick reference during live sessions

Recreational and intermediate players who want to improve are stuck between "watch poker YouTube videos" and "spend $50+/mo learning range matrices."

## The Solution

A mobile app where you can:

> "I'm on the bubble of a 200-person tournament, 22 left, 20 pay. I have 15BB in the cutoff with AQo. UTG opens 2.2x. What should I do?"

And get back:

> "This is a clear 3-bet shove. With 15BB, AQo is well within your shoving range from the CO facing a UTG open. While you're near the bubble, your stack is short enough that ICM pressure doesn't override the +EV of this shove. Folding here would be too tight — you'd be giving up too much equity with a premium hand at a stack depth where you need to accumulate chips."

The answer is backed by actual solver data, not LLM hallucination. The LLM interprets and explains, but the numbers come from precomputed GTO solutions.

## Core Value Proposition

**"A poker coach in your pocket that speaks plain English and backs every answer with real math."**

### For whom
- Tournament grinders who want to study on the go
- Live players who want quick answers at breaks
- Intermediate players moving from "vibes" to GTO-informed play
- Anyone priced out of GTO Wizard's premium tiers

### Not for (at least initially)
- Professional high-stakes players who need PioSolver-level customization
- Cash game specialists (tournament-first, cash later)
- PLO players (Hold'em first)

## How It Works (User Perspective)

### 1. Preset Configuration
Set up your session context once:
- Tournament type (MTT, SNG, satellite)
- Stack size / blind level
- Table size (6-max, 9-max, final table)
- Your position

### 2. Ask Questions
Three interaction modes:

**Quick Query** — "Is AJs a 3-bet from the button vs CO open at 20BB?"
**Hand Review** — "I had KK on the button, called a 3-bet, flopped K72 rainbow. Villain c-bet half pot. Was slow-playing correct?"
**Scenario Builder** — Step through a hand with structured inputs (cards, actions, board)

### 3. Get Answers
- Solver-backed recommendation (fold/call/raise with frequencies)
- Natural language explanation of *why*
- Context-aware adjustments (ICM, stack depth, position)
- Optional deep dive (range charts, EV breakdown)

## What This Is NOT

- **Not a real-time HUD** — not reading live game data, you describe situations
- **Not a cheating tool** — designed for study, breaks, and post-session review
- **Not a generic ChatGPT wrapper** — the LLM queries actual GTO data, it doesn't make up poker strategy
- **Not trying to replace PioSolver** — different audience, different use case

## Name Ideas

- Mako (keep the brand from existing project)
- Pocket Coach
- SharkGPT
- SolverChat
- GTO Pocket
- (TBD — not important for now)
