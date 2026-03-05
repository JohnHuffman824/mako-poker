---
title: "Poker Assistant - GTO Engine Design"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, gto, cfr, solver, precomputed, engine]
related: [00-index, 02-architecture, 07-mako-poker-assessment, 11-tournament-gto, 12-research-topics]
---

# GTO Engine Design

The core computation layer that provides accurate poker strategy data. The LLM interprets this data — it never generates it.

## Three-Tier Computation Model

### Tier 1: Precomputed Solutions (Instant Lookup)

The backbone. Covers the most common scenarios with instant, accurate answers.

#### What to Precompute

**Preflop**
- Opening ranges by position (UTG through BTN) for various stack depths
- 3-bet ranges vs each position
- 4-bet/5-bet ranges
- Squeeze ranges
- Blind defense ranges (SB and BB vs each position)
- Push/fold charts for short stacks (1-25BB)
- All of the above segmented by: stack depth, table size (6-max, 9-max), tournament stage

**Postflop (harder, much larger space)**
- Common board textures (rainbow, monotone, paired, connected)
- Standard c-bet spots (IP and OOP)
- Facing c-bet decisions
- Turn and river play for the most common lines

#### Storage Approach

Preflop ranges can be stored as compressed lookup tables:
```
Key: (position, action_sequence, stack_depth_bucket, table_size)
Value: {hand_class -> action_frequencies}
```

Example:
```json
{
  "key": "CO_open_20bb_9max",
  "ranges": {
    "AA": {"raise": 1.0},
    "AKs": {"raise": 1.0},
    "AKo": {"raise": 1.0},
    "AQs": {"raise": 1.0},
    "AQo": {"raise": 0.85, "fold": 0.15},
    "72o": {"fold": 1.0}
  }
}
```

**Estimated storage**: Preflop ranges for all standard spots = ~50-200MB compressed. Postflop would be orders of magnitude larger — need selective coverage.

#### Data Sources

Options for building the precomputed database:
1. **Train Mako's CFR solver** — run Deep CFR on GPU, export solutions
2. **Use open-source solvers** — TexasSolver (C++), WASM Postflop (Rust)
3. **Curate from public GTO data** — many training sites publish range charts
4. **Hybrid** — solver-generated core + curated tournament-specific data

### Tier 2: Runtime Computation (Real-Time Math)

For calculations that are fast enough to run per-request but can't be fully precomputed.

#### Equity Calculations
- Hand vs hand equity (e.g., AKs vs QQ on a given board)
- Hand vs range equity
- Range vs range equity
- Monte Carlo simulation for complex multi-way pots

**Feasibility**: Hand vs hand equity takes <10ms. Range vs range with Monte Carlo takes ~100-500ms. Acceptable for API response times.

#### ICM Calculations
- Independent Chip Model for tournament equity
- Push/fold Nash equilibrium ranges adjusted for pay structure
- Bubble factor computation
- Final table deal equity (chip chop, ICM chop)

**Feasibility**: ICM for 9 players with standard pay structure takes ~50-200ms. Very doable.

See [[11-tournament-gto]] for more tournament-specific computation.

#### Stack-Adjusted Ranges
- Take precomputed GTO ranges and adjust for exact stack depth
- Interpolate between precomputed stack depth buckets
- Adjust for ICM pressure at specific tournament stages

### Tier 3: Neural Network Inference (Edge Cases)

For novel postflop spots where precomputed data doesn't exist.

#### Mako's ONNX Pipeline
The existing Mako Poker codebase already has:
- Deep CFR training in Python (PyTorch)
- ONNX export (`solver/src/training/onnx_export.py`)
- TypeScript ONNX Runtime wrapper (`packages/inference/`)
- Hand bucketing (1326 hands -> ~200 buckets)
- Strategy model class with `predict()` and `interpretOutput()`

#### How It Would Work
1. User describes a novel postflop scenario
2. Backend parses it into structured game state
3. Game state is encoded as model input (buckets, pot ratios, stack ratios, action history)
4. ONNX model returns action probabilities
5. Claude interprets the output for the user

#### Limitations
- Model quality depends on training data and CFR iterations
- Postflop with multiple streets is MUCH harder than preflop
- Need significant GPU time to train a good model
- Accuracy will be lower than PioSolver — acceptable for target audience

## Accuracy Guarantees

This is critical. The app must not give bad advice.

### Strategy
1. **Precomputed data is the gold standard** — solved by CFR to convergence
2. **Runtime calculations are exact math** — equity and ICM are deterministic
3. **Neural network results carry a confidence score** — if confidence is low, tell the user
4. **The LLM never generates strategy numbers** — it only interprets and explains
5. **Cross-reference multiple sources** — if a precomputed answer and a runtime calc disagree, flag it

### Confidence Levels in Responses
- **High confidence**: Precomputed solution exists for this exact spot
- **Medium confidence**: Close precomputed match + runtime adjustment
- **Lower confidence**: Neural network inference for novel spot
- Always be transparent about confidence level with the user

## Technical Decisions Still Needed

- [ ] Which solver to use for precomputing data (Mako CFR vs TexasSolver vs WASM Postflop)
- [ ] How many stack depth buckets to precompute (every BB? every 5BB?)
- [ ] Postflop coverage scope for MVP (just c-bet spots? or deeper?)
- [ ] GPU resources for training (cloud GPU rental vs local)
- [ ] Database choice for precomputed lookups (Postgres? Redis? SQLite?)

See [[12-research-topics]] for the full list of open questions.
