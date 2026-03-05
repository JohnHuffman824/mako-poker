---
title: "Poker Assistant - Tournament-Specific GTO"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, tournament, icm, gto, push-fold, mtt, bubble]
related: [00-index, 03-gto-engine, 09-mvp-definition, 12-research-topics]
---

# Tournament-Specific GTO

Tournaments are the primary focus. Tournament GTO is significantly different from cash game GTO because of ICM (Independent Chip Model) and changing dynamics throughout the event.

## Key Tournament Concepts

### ICM (Independent Chip Model)
Converts chip stacks into tournament equity (real dollar value).

- In a cash game, 1000 chips = $1000. In a tournament, 1000 chips ≠ $1000.
- A chip you lose is worth more than a chip you gain (diminishing returns).
- ICM creates pressure to avoid busting, especially near pay jumps.

**Calculation**: Given N players with stacks S1...SN and a payout structure P1...PM, ICM computes each player's equity ($EV).

**Runtime feasibility**: ICM for 9 players takes ~50-200ms. Doable per-request. For larger fields, approximations are needed.

### Bubble Play
The most ICM-sensitive phase. When one more elimination means everyone remaining gets paid.

Key dynamics:
- Short stacks gain survival equity by folding
- Big stacks can exploit by opening very wide (nobody wants to bust)
- Medium stacks are in the worst position (can't bully, can't fold to the money easily)
- Adjustments depend heavily on pay structure and remaining stack distribution

### Push/Fold
When stacks are short (typically <15-20BB), decisions simplify to all-in or fold.

Push/fold ranges depend on:
- Position
- Stack size in BB
- Number of players yet to act
- ICM considerations (bubble, pay jumps)
- Opponent stack sizes

This is highly precomputable. For each (position, stack, ICM scenario), there's a Nash equilibrium push range.

### Final Table Dynamics
- Pay jumps become significant (1st place often 2-3x 2nd place)
- ICM pressure is extreme
- Stack-size awareness is critical
- Short-handed play (fewer players = wider ranges)
- Deal-making equity (chip chop, ICM chop)

### PKO (Progressive Knockout) Tournaments
- Bounties add EV to busting players
- Modifies calling ranges (wider calls when bounty is large)
- Covered vs. covering dynamics
- Growing in popularity — HRC doesn't handle this well

## Tournament Stages

| Stage | Players Left | Typical Dynamics | Our Features |
|-------|-------------|------------------|--------------|
| Early | >50% field | Deep stacks, chip accumulation | Standard GTO ranges |
| Middle | 30-50% field | Stacks thinning, antes kick in | Adjusted ranges for antes |
| Late | 15-30% field | Short stacks, approaching bubble | ICM-aware ranges |
| Bubble | Near payout threshold | Maximum ICM pressure | Full ICM calculations, push/fold |
| ITM (In the Money) | Below payout line | ICM relaxes slightly, pay jump awareness | Pay jump adjusted ranges |
| Final Table | Last table | Huge pay jumps, extreme ICM | Full FT ICM, deal equity |

## What to Precompute vs. Calculate at Runtime

### Precompute (Store in DB)
- Push/fold Nash ranges for standard stack depths (1-25BB) by position
- Opening ranges adjusted for common tournament stages
- 3-bet ranges adjusted for stack depth
- Standard ICM-adjusted ranges for 9-handed final tables

### Calculate at Runtime
- ICM equity for the user's specific stack/payout situation
- Bubble factor for the exact tournament state
- Pay jump EV adjustments
- PKO bounty adjustments

### Needs Solver (Deep CFR or External)
- Complex postflop ICM spots
- Multi-way all-in ICM decisions
- Non-standard stack distributions

## ICM Implementation

### Basic ICM Algorithm

The Malmuth-Harville model:

```
For each player, calculate probability of finishing in each position:
P(1st) = stack_i / total_chips
P(2nd) = Σ_j≠i [P(j finishes 1st) × P(i finishes 2nd | j finished 1st)]
... recursively for all positions

Then: equity_i = Σ_k [P(finish k) × payout_k]
```

**Complexity**: O(N! / (N-M)!) where N = players, M = paying positions. Exponential, but:
- 9 players → fast (< 100ms)
- 20+ players → need approximations or Monte Carlo

### Bubble Factor

Measures how much ICM pressure you're under:

```
bubble_factor = (chips lost EV) / (chips gained EV)
```

- Bubble factor of 1.0 = cash game (no ICM pressure)
- Bubble factor of 2.0 = losing a chip costs twice what gaining one is worth
- On the bubble, BF can be 3.0+ for medium stacks

This is what adjusts GTO ranges — higher bubble factor = tighter play.

## Comparison with Competitor Tournament Tools

### HRC (Holdem Resources Calculator)
- Best tournament push/fold tool on the market
- ICM accuracy within ±0.01%
- $10-30/mo
- Desktop only
- Limited to push/fold scenarios (not full postflop)

### ICMIZER
- Professional ICM analysis
- Nash equilibrium for tournaments
- Mobile SNG Coach add-on ($95/yr)
- More limited than HRC for complex scenarios

### GTO Wizard (Tournament)
- Has tournament solutions but less depth than HRC
- Precomputed for standard scenarios
- Expensive

### Our Advantage
- **Mobile-native** tournament ICM (HRC is desktop only)
- **Natural language** — "I have 12BB in the SB, 3 off the bubble, should I shove K9s?"
- **Conversational context** — set tournament state once, ask multiple questions
- **Cheaper** than GTO Wizard for comparable tournament features

## Implementation Priority

1. **Push/fold charts** — highest value, most precomputable, clearest user need
2. **ICM calculator** — enables bubble/final table awareness
3. **Stage-adjusted preflop ranges** — different opens for 20BB vs 50BB tournaments
4. **Pay jump analysis** — "is it worth risking X chips when the next pay jump is Y?"
5. **PKO adjustments** — growing format, underserved by existing tools
6. **Final table solver** — complex but high value for serious players
