---
title: "Poker Assistant - UX Design & User Flows"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, ux, design, ui, user-flows, mobile]
related: [00-index, 01-vision, 05-cross-platform-mobile]
---

# UX Design & User Flows

## Design Principles

1. **Speed first** — at a poker break you have 5 minutes, not 15
2. **Plain English in, plain English out** — no jargon-heavy input required
3. **Progressive disclosure** — simple answer first, tap for deep dive
4. **Context persistence** — don't make me re-enter my tournament setup every time
5. **One-hand operation** — usable with one thumb on a phone

## Core Screens

### 1. Home / Quick Query

The primary screen. A chat-like interface optimized for quick poker questions.

```
┌─────────────────────────┐
│  🎯 Mako Poker Coach    │
│  [MTT · 15BB · CO]  ⚙️  │  <- Active preset shown as chips
├─────────────────────────┤
│                         │
│  ┌─────────────────┐   │
│  │ You: UTG opens   │   │
│  │ 2.2x, I have AQo│   │
│  │ on the bubble.   │   │
│  │ Shove or fold?   │   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │ 🃏 SHOVE (92%)  │   │
│  │                  │   │
│  │ Clear shove at   │   │
│  │ 15BB. AQo has    │   │
│  │ strong equity vs │   │
│  │ UTG range...     │   │
│  │                  │   │
│  │ [Show Details ▼] │   │
│  └─────────────────┘   │
│                         │
├─────────────────────────┤
│ [Type your question...] │
│              [Send ▶]   │
└─────────────────────────┘
```

**Key Elements:**
- Active preset bar at top (tap to change)
- Chat-style message flow
- Recommendation displayed prominently with action + frequency
- "Show Details" expands to range chart, EV breakdown, etc.
- Keyboard-optimized input

### 2. Preset Configuration

Set up session context before playing. Persists until changed.

```
┌─────────────────────────┐
│  Session Setup          │
├─────────────────────────┤
│                         │
│  Game Type              │
│  [Tournament ▼]        │
│                         │
│  Format                 │
│  [MTT] [SNG] [Sat]     │
│                         │
│  Table Size             │
│  [6-max] [9-max] [FT]  │
│                         │
│  Your Stack (BB)        │
│  [____15____]           │
│                         │
│  Blind Level            │
│  [100/200 ante 25]      │
│                         │
│  Players Remaining      │
│  [___22___]             │
│                         │
│  Pay Structure          │
│  [Top 20 pay ▼]        │
│                         │
│  ──────────────────     │
│                         │
│  Saved Presets          │
│  [My Weekly MTT]        │
│  [Sunday Major]         │
│  [Local 1/2 Cash]       │
│                         │
│  [Save Preset] [Apply]  │
└─────────────────────────┘
```

**Key Features:**
- Chip-style toggles for common options
- Stack size slider with BB display
- Save/load presets for recurring games
- Quick-apply from preset list
- Preset data flows into all queries as context

### 3. Hand Review

Step through a full hand with structured input + natural language.

```
┌─────────────────────────┐
│  Hand Review            │
├─────────────────────────┤
│                         │
│  Describe the hand or   │
│  use the builder below  │
│                         │
│  ┌───────────────────┐  │
│  │ Your Hand: [A♠][Q♦]│  │
│  │ Position: [CO ▼]  │  │
│  │ Stack: [15 BB]    │  │
│  └───────────────────┘  │
│                         │
│  PREFLOP                │
│  UTG opens 2.2x        │
│  Hero: [Fold][Call][3b] │
│                         │
│  FLOP: [K♠][7♥][2♦]   │
│  Villain bets 1/2 pot   │
│  Hero: [Fold][Call][Raise│
│                         │
│  ──────────────────     │
│                         │
│  Or just describe it:   │
│  [Type the hand...]     │
│              [Analyze ▶]│
└─────────────────────────┘
```

**Two input modes:**
1. **Structured builder** — tap through cards, positions, actions street by street
2. **Natural language** — "I had AQ in the CO, UTG opened, I shoved, he called with JJ. Board ran out K72 4 8."

Both produce the same analysis.

### 4. Study / Drill Mode

Practice GTO decisions with quiz-style scenarios.

```
┌─────────────────────────┐
│  GTO Trainer            │
│  Score: 7/10 (70%)      │
├─────────────────────────┤
│                         │
│  Tournament · 20BB · BTN│
│                         │
│  Your hand: [J♠][T♠]   │
│  CO opens 2.5x          │
│                         │
│  What's your action?    │
│                         │
│  [FOLD]  [CALL]  [3-BET]│
│                         │
│                         │
│                         │
│                         │
│  ──────────────────     │
│  Category: [All ▼]      │
│  Difficulty: [● ● ○ ○]  │
└─────────────────────────┘
```

After answering:
- Show correct GTO action with frequencies
- Explain why
- Track accuracy over time
- Identify leak patterns ("You fold too much from the BTN facing CO opens")

### 5. Profile / History

```
┌─────────────────────────┐
│  Profile                │
├─────────────────────────┤
│                         │
│  Study Stats            │
│  Queries today: 12      │
│  Accuracy: 73%          │
│  Streak: 5 days         │
│                         │
│  Identified Leaks       │
│  • Too tight on bubble  │
│  • Under-bluffing river │
│  • Calling too wide OOP │
│                         │
│  Recent Hands           │
│  [AQo CO vs UTG - Shove]│
│  [88 BTN vs 3bet - Call] │
│  [K9s SB defense - ...]  │
│                         │
│  [Saved Presets]         │
│  [Settings]              │
│  [Subscription]          │
└─────────────────────────┘
```

## Interaction Patterns

### Quick Actions (Speed Shortcuts)
For common queries, provide tap-through shortcuts:
- "Should I open this hand?" → Tap position + hand → instant answer
- "Push or fold?" → Tap stack size + hand → instant chart
- "What's my equity?" → Tap hand + villain range → instant calc

### Voice Input (Future)
At a poker table, typing is conspicuous. Voice input would be more natural:
- "Hey Mako, is ace-queen off a shove at 15 bigs from the cutoff?"
- Requires good speech-to-text for poker terminology

### Haptic Feedback
- Correct answer in quiz mode → success haptic
- New recommendation loaded → light tap
- Error/invalid input → warning haptic

## Information Hierarchy

For every recommendation, layer information:

**Layer 1 (Always shown):** Action + frequency (e.g., "SHOVE 92%")
**Layer 2 (One tap):** Brief explanation (2-3 sentences of why)
**Layer 3 (Expand):** Full analysis — EV breakdown, range chart, alternative actions, edge cases
**Layer 4 (On request):** Deep dive — comparable spots, theory explanation, related concepts

## Visual Language

- Card suits in color (♠♣ dark, ♥♦ red)
- Actions color-coded: Fold (gray), Call (blue), Raise/Bet (green), All-in (orange)
- Frequency bars for mixed strategies
- Clean, minimal design — not cluttered like existing poker tools
- Dark mode default (poker players often play in dim environments)
