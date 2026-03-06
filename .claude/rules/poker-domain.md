---
paths: 'packages/shared/**, apps/api/src/domain/**, solver/**'
---

# Poker Domain Conventions

## Card Notation

- Ranks: single char — `'2'`-`'9'`, `'T'`, `'J'`, `'Q'`, `'K'`, `'A'`
- Ten is `'T'`, NEVER `'10'`
- Suits: `'s'` (spades), `'h'` (hearts), `'d'` (diamonds), `'c'` (clubs)
- Card: rank + suit, e.g., `'As'`, `'Th'`, `'2c'`

## Hand Notation

- `"AKs"` — suited (same suit)
- `"AKo"` — offsuit (different suits)
- `"AK"` — both suited and offsuit
- `"AA"` — pocket pair

## Positions

BTN, SB, BB, UTG, UTG+1, UTG+2, MP, HJ, CO

Use `POSITION_NAMES` from `@mako/shared` for position ordering. Positions recalculate every hand based on dealer button rotation.

## Stack Sizes

Always expressed in BB (big blinds), not chip counts.

## GTO Data

- **Never hallucinate solver numbers** — all GTO data comes from precomputed database

## Action Notation

- Code: `fold`, `call`, `raise`, `all-in` (lowercase)
- UI: Display-case (`Fold`, `Call`, `Raise`, `All-In`)

## Street Names

`preflop`, `flop`, `turn`, `river` (lowercase in code)
