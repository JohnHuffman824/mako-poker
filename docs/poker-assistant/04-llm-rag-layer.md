---
title: "Poker Assistant - LLM/RAG Interpretation Layer"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, llm, rag, claude, anthropic, nlp, ai]
related: [00-index, 02-architecture, 03-gto-engine, 12-research-topics]
---

# LLM/RAG Interpretation Layer

The LLM (Claude) serves as the **interface layer** between the user and the GTO engine. It does NOT compute poker strategy — it translates between human language and solver data, and provides qualitative coaching.

## Two-Phase LLM Usage

### Phase 1: Natural Language Parsing

Transform user's plain English into structured query parameters.

**Input** (user):
> "I'm in a 200-person MTT, 22 left and 20 pay. 15BB stack in the CO. UTG opens 2.2x. I have AQo."

**Output** (structured):
```json
{
  "tournament": {
    "type": "MTT",
    "total_players": 200,
    "remaining": 22,
    "paying": 20,
    "stage": "bubble"
  },
  "hero": {
    "position": "CO",
    "stack_bb": 15,
    "hand": "AQo"
  },
  "action": {
    "villain_position": "UTG",
    "villain_action": "open",
    "villain_sizing": 2.2
  },
  "question_type": "action_decision",
  "street": "preflop"
}
```

#### Parsing Challenges
- Ambiguous position names ("middle position" = MP? UTG+1?)
- Shorthand ("I had ace queen off" = AQo)
- Implicit information ("standard open" = 2-2.5x at most stakes)
- Multiple questions in one message
- Follow-up context from conversation history

#### Approach
- Use Claude's tool use / function calling to extract structured data
- Define a clear schema for poker scenarios
- Handle ambiguity by asking clarifying questions
- Maintain conversation context for follow-ups

### Phase 2: Strategy Interpretation

Transform raw solver output into coaching-quality explanation.

**Input** (from GTO engine):
```json
{
  "recommendation": {
    "shove": 0.92,
    "fold": 0.08,
    "call": 0.00
  },
  "ev": {
    "shove": 1.45,
    "fold": 0.0,
    "call": -0.23
  },
  "context": {
    "icm_pressure": 0.15,
    "hand_percentile": 0.88,
    "villain_range_width": 0.12
  }
}
```

**Output** (to user):
> "This is a clear shove (92% of the time in this spot). With 15BB and AQo, you're in a strong position to 3-bet all-in against a UTG open. Here's why:
>
> **Stack depth**: At 15BB, you're in the 'shove or fold' zone for 3-bets. Flatting AQo here bloats the pot with a hand that plays poorly postflop OOP.
>
> **Hand strength**: AQo is in the top 12% of hands. Against a typical UTG opening range (top 12-15%), you have solid equity.
>
> **ICM factor**: You're 2 spots from the money, which does create some ICM pressure. But your stack is short enough that the chip EV gain from shoving outweighs the bubble risk. Folding premium hands here leaves you too short to survive.
>
> **The 8% fold frequency** accounts for rare spots where the table dynamics strongly favor caution (e.g., very tight UTG player, extreme short stacks at other tables)."

#### Interpretation Prompt Engineering

The system prompt for interpretation needs to:
1. Emphasize that all strategy numbers come from the GTO data, not the LLM
2. Explain the "why" behind decisions using poker concepts
3. Adjust explanation depth based on user's skill level
4. Reference ICM, position, stack depth, and hand strength in context
5. Be honest about confidence levels
6. Avoid poker cliches and filler language

#### Example System Prompt (Draft)

```
You are a poker strategy interpreter. You receive two inputs:
1. A player's question about a poker situation
2. Structured GTO solver data for that situation

Your job is to explain the solver's recommendation in clear, educational language.

Rules:
- NEVER invent strategy numbers. Only cite data from the solver output.
- Explain WHY the solver recommends this action using poker concepts.
- Adjust explanation depth to the user's apparent skill level.
- When confidence is lower (neural network inference), say so explicitly.
- Reference relevant concepts: ICM, position, stack-to-pot ratio, equity, range advantage.
- Be concise but thorough. Don't pad with filler.
- If the spot is close (mixed strategy), explain both sides.
```

## RAG (Retrieval-Augmented Generation)

### What to Retrieve

The RAG component could pull from several knowledge bases:

1. **GTO solver data** (primary) — the precomputed solutions, equity calcs, ICM data
2. **Poker theory articles** — curated explanations of concepts for the LLM to reference
3. **User's hand history** — "you tend to fold too much in this spot" type coaching
4. **Tournament structure data** — blind levels, pay structures, ICM tables

### RAG Architecture Options

**Option A: Tool Use (Recommended for MVP)**
- Claude calls tools/functions to query the GTO engine
- No vector database needed
- Each tool returns structured data
- Tools: `lookup_preflop_range`, `calculate_equity`, `compute_icm`, `get_push_fold_chart`

**Option B: Vector DB + Embeddings (Later)**
- Embed poker theory articles and solver explanations
- Retrieve relevant context for complex questions
- Better for open-ended coaching conversations
- Could use Pinecone, Weaviate, or pgvector

**Recommendation**: Start with Tool Use (Option A). Add vector RAG later for coaching depth.

## Conversation Modes

### Quick Query Mode
- Single question, single answer
- Fastest response time
- Minimal context needed
- Example: "Is 76s a 3-bet bluff from the BTN vs CO open at 30BB?"

### Hand Review Mode
- Walk through a complete hand
- Multi-turn conversation
- Builds context across streets
- Example: "Let me tell you about a hand from tonight..."

### Study Mode
- Open-ended coaching conversation
- Drill specific concepts
- Quiz functionality ("What would you do here?")
- Reference user's past hands and patterns

### Session Preset Mode
- Configure once: "I'm playing a $50 MTT, 9-max, starting stack 10K, blinds 50/100"
- All subsequent queries inherit this context
- "UTG raises, I have JTs on the button" — no need to re-specify tournament details

## Cost Management

Claude API costs per query (estimated):
- **Parsing call**: ~500-1000 input tokens, ~200-500 output tokens
- **Interpretation call**: ~1000-2000 input tokens (includes solver data), ~500-1500 output tokens
- **Total per query**: ~$0.01-0.05 depending on complexity

At 50 queries/day for an active user: ~$0.50-2.50/day = ~$15-75/month per active user.

### Cost Optimization Strategies
- Cache common question patterns (same question = same parse)
- Use Haiku for simple parsing, Sonnet/Opus for interpretation
- Batch similar queries
- Limit free tier to N queries/day
- Precompute common explanations (don't call Claude for "is AA an open from UTG?")

## Open Questions

- [ ] How to handle multi-street hand reviews efficiently (context window management)
- [ ] Whether to fine-tune a model on poker data vs. prompt engineering alone
- [ ] How to prevent the LLM from making up strategy that contradicts solver data
- [ ] User skill level detection (beginner vs advanced explanations)
- [ ] Conversation memory across sessions (remember user's leaks)

See [[12-research-topics]] for more.
