---
paths: 'apps/api/src/services/scenario-parser*, apps/api/src/services/strategy-interpreter*, apps/api/src/services/gto-query*'
---

# LLM Integration Conventions

## Two-Phase Pattern

Every poker query follows two Claude API calls:

1. **Parse Phase**: Natural language -> structured `PokerScenario`
   - Uses tool_use / function calling for structured extraction
   - Input: user's natural language question
   - Output: typed scenario object (positions, stack sizes, actions, board)

2. **Interpret Phase**: Solver data -> natural language explanation
   - Uses system prompt + user context + solver data
   - Input: GTO solver results from database
   - Output: conversational explanation with strategy advice

## Rules

- **Never let Claude generate GTO numbers** — all numbers from precomputed DB
- Use appropriate model tier for each phase (parse can use lighter model)
- Parse phase extracts; interpret phase explains. Never mix.

## Prompt Structure

```
System prompt (role, constraints, format instructions)
-> User question (natural language)
-> Solver data (from DB, injected as context)
-> Format instructions (how to present the answer)
```

## Confidence Levels

- **High**: exact scenario match in solver DB
- **Medium**: interpolated from similar scenarios
- **Low**: extrapolated, clearly flagged to user

## Error Handling

- Ambiguous input -> ask clarifying questions (don't guess)
- Missing solver data -> explain what data is available, suggest alternatives
- API failures -> graceful degradation with retry
