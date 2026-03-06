---
title: "Context Engineering Guide"
type: guide
area: playbook
status: active
tags:
  - context-engineering
  - best-practices
  - ai-development
created: 2026-03-05
updated: 2026-03-05
related:
  - docs/plans/02-ai-infrastructure.md
  - CLAUDE.md
---

# Context Engineering Guide

A research-backed reference for designing, structuring, and maintaining documentation and context files that maximize AI-assisted development quality. Use this document to validate any context artifact — instruction files, rules, skills, documentation — against established best practices.

**When to reference this guide:**
- Creating or editing a CLAUDE.md, rule, skill, or agent definition
- Writing documentation that AI will consume
- Auditing existing context files for quality
- Debugging degraded AI performance in a project

---

## 1. What Is Context Engineering

Context engineering is the discipline of designing the optimal set of information available to an LLM at inference time. It supersedes "prompt engineering" in the same way software architecture supersedes writing individual functions.

| Prompt Engineering | Context Engineering |
|---|---|
| "How should I phrase this?" | "What information does the model need?" |
| Single interaction focus | Full system lifecycle |
| Writing instructions | Systems design for LLMs |

Andrej Karpathy defined it as "the delicate art and science of filling the context window with just the right information for the next step." [^karpathy]

Anthropic's guiding principle: **"Find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome."** [^anthropic-ce]

### The Seven Components of Context

Every model call draws from seven sources (Philipp Schmid [^schmid]):

1. **System instructions** — Persistent behavioral rules (CLAUDE.md, rules files)
2. **User prompts** — The current request
3. **Conversation history** — Prior turns in the session
4. **Long-term memory** — Persisted patterns and preferences
5. **Retrieved information** — Docs, search results, file contents loaded on demand
6. **Available tools** — Tool definitions and schemas
7. **Output specifications** — Format constraints, schemas, templates

Effective context engineering manages all seven, not just the prompt.

---

## 2. Core Principles

These principles are supported by research across Anthropic, Google, Stanford, MIT, JetBrains, and production teams building AI agents at scale. They apply regardless of which AI tool you use.

### 2.1 The Token Budget Is Zero-Sum

Context allocation is zero-sum. Every token of documentation loaded displaces a token of conversation history. Effective systems treat context "the way operating systems treat memory and CPU cycles: as finite resources to be budgeted, compacted, and intelligently paged." [^factory]

**Practical rule:** For each line in an always-loaded file, ask: "Would removing this cause the AI to make mistakes?" If no, remove it.

### 2.2 Context Rot Degrades Performance Non-Linearly

Adobe researchers tested 18 leading LLMs and found dramatic accuracy drops with context length — GPT-4o from 99% to 70% at 32K tokens, Claude 3.5 Sonnet from 88% to 30%. Performance degrades gradually, not as a cliff, but models typically become unreliable well before their advertised context limit. [^context-rot]

Anthropic identifies four failure modes of context rot [^anthropic-ce]:

| Failure Mode | What Happens | Example |
|---|---|---|
| **Poisoning** | Incorrect/outdated info in context | Stale API docs reference deleted endpoints |
| **Distraction** | Irrelevant info competing for attention | Loading full codebase description for a CSS fix |
| **Confusion** | Similar but distinct info mixed together | Two conflicting style guides loaded simultaneously |
| **Clash** | Contradictory statements without resolution | CLAUDE.md says "use tabs," rule file says "use spaces" |

### 2.3 The U-Shaped Attention Curve

LLMs perform best on information at the **beginning and end** of context, with significant degradation in the middle. This "lost-in-the-middle" effect (Stanford/UNC, 2023 [^lost-in-middle]) is architecturally baked into transformer attention via Rotary Position Embedding, confirmed by MIT research in 2025 [^mit-bias].

**Performance impact:** 20-40% accuracy degradation for information positioned in the middle of long prompts versus beginning/end. [^lost-in-middle]

**Practical rules:**
- Put the most critical rules and instructions at the top of every context file
- For long documents, echo key rules in a summary at the end
- When loading multiple documents, place the most relevant ones first and last

### 2.4 Signal Density Over Volume

JetBrains studied context management for coding agents and found that observation masking (hiding irrelevant tool results) achieved a 2.6% solve rate improvement AND 52% cost reduction simultaneously. Summarization, by contrast, caused agents to run 13-15% longer. [^jetbrains]

**Key finding:** "Well-selected, well-placed information consistently outperforms large, noisy inputs, because models fail more often from poor context management than from insufficient context size."

### 2.5 Examples Over Exhaustive Rules

Anthropic's official guidance: "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure. A few well-crafted examples can dramatically improve accuracy and consistency." [^anthropic-bp]

Research consistently shows 3-5 diverse examples outperform exhaustive rule lists. The label distribution and format of examples matter more than perfect accuracy in every example — even examples with random labels outperform no examples, because the structural signal is what the model learns from. [^fewshot-research]

**Important caveat for agent systems:** Anthropic warns that few-shot examples effective for single-turn responses "often backfire when agents need to work autonomously." For autonomous agents, prefer heuristics and principles over rigid scripted examples. [^anthropic-ce]

---

## 3. Document Structure for AI Consumption

### 3.1 Markdown Is the Optimal Format

Markdown is approximately 15% more token-efficient than JSON and dramatically cheaper than HTML. A simple section costs ~3 tokens in Markdown versus 12-15 in HTML. Bun reported a 10x reduction in token usage serving docs as Markdown. [^cloudflare]

| Format | Relative Token Cost | AI Comprehension |
|---|---|---|
| Clean Markdown | Baseline | Highest for most tasks |
| JSON | ~15% more | Highest for GPT-3.5 on specific tasks |
| Plain text | ~10-15% fewer | Lower on complex structured tasks |
| HTML/XML | Significantly higher | Lower — tag overhead without semantic gain |
| Markdown-KV | 2.7x more than CSV | Highest accuracy for tabular data (60.7%) |

Source: [^format-research]

### 3.2 Effective Formatting Elements

**Headers (H1-H3)** are the single most effective structural signal. LLMs use heading hierarchy as a blueprint for understanding information relationships before reading body text. Content with clear heading hierarchy is 28-40% more likely to be accurately extracted. [^doc-structure]

**Ranked by effectiveness:**

| Element | Use For | Why It Works |
|---|---|---|
| Headers (H1-H3) | Document map, section boundaries | Highest structural signal; parsed before body |
| Code blocks | Templates, commands, literal content | Clear boundary prevents paraphrasing |
| Bullet lists | Rules, requirements, collections | Parsed as discrete items, not continuous prose |
| Numbered lists | Procedures, sequential steps | Signals ordering; reduces step-skipping |
| Tables | Reference data, mappings, comparisons | Pattern recognition; routing decisions |
| Bold text | Key terms, critical warnings | Effective only when used sparingly |

**Anti-patterns that degrade performance:**

| Anti-Pattern | Problem |
|---|---|
| Deeply nested lists (4+ levels) | Destroys hierarchy, ambiguous parent-child |
| Walls of text (multi-idea paragraphs) | Unreliable extraction vs. lists/sections |
| Mixed/skipped heading levels | Disrupts semantic parsing |
| Everything emphasized | When everything is bold, nothing is |
| HTML inside Markdown | Higher token cost, lower comprehension |

### 3.3 The WHAT-WHY-HOW Framework

Validated by HumanLayer's CLAUDE.md research [^humanlayer], this ordering maximizes both comprehension and actionability:

1. **WHAT** — Context, scope, stack, structure
2. **WHY** — Purpose, relationships, design decisions
3. **HOW** — Commands, procedures, verification steps

```markdown
# API Rate Limiting                              <- WHAT: scope

Rate limiting protects downstream services       <- WHY: purpose
from cascade failures during traffic spikes.

## Configuration                                  <- HOW: procedure
Set `RATE_LIMIT_RPM=1000` in `.env`.
Run `bun test` to verify.
```

### 3.4 Document Sizing

| Size | Assessment | Action |
|---|---|---|
| < 100 lines | Too granular for useful context | Consider merging with related doc |
| 100-400 lines | Optimal — focused, complete, token-efficient | Target range |
| 400-800 lines | Moderate noise risk for always-loaded files | OK for on-demand reference docs |
| 800+ lines | Active performance degradation if fully loaded | Split into focused sub-documents |

Always-loaded files (CLAUDE.md, rules) should target the lower end. On-demand reference docs can be longer because they're only loaded when relevant.

### 3.5 Decision Trees Over Prose for Branching Logic

For conditional behavior (routing, "if X do Y"), structured tables outperform prose:

```markdown
# Less effective (prose)
If you encounter a bug or error, you should use the debug skill.
When writing code, prefer the tdd skill. For large refactors,
use plan-refactor instead.

# More effective (table)
| Trigger            | Action          |
|--------------------|-----------------|
| Bug/error/failure  | Use `debug`     |
| Writing code       | Use `tdd`       |
| Large refactor     | Use `plan-refactor` |
```

---

## 4. Using Examples Effectively

### 4.1 The Research Case for Examples

Anthropic's engineering team: "For an LLM, examples are the pictures worth a thousand words." [^anthropic-ce]

Key findings:
- Few-shot prompting (1-10 examples) consistently outperforms zero-shot for tasks requiring specific format, tone, or structure [^fewshot-research]
- The gap widens with model capability — frontier models benefit disproportionately from well-structured examples
- A single well-chosen example can improve code synthesis quality comparable to architectural upgrades [^promptlayer]
- Anthropic recommends **3-5 examples** for best results [^anthropic-bp]

### 4.2 Example Types and When to Use Each

| Situation | Best Example Type | Count |
|---|---|---|
| Output format is novel or non-obvious | Input/output pairs | 3-5 |
| Subtle behavioral distinction | Before/after comparison | 1-2 pairs |
| Establishing hard boundaries | Negative + positive paired | 1-2 |
| Autonomous agent heuristics | Principles, not rigid examples | Minimal |
| Template enforcement | One filled-in template | 1 |
| Well-understood common task | None needed | 0 |

### 4.3 Before/After Comparisons

Anthropic uses this format throughout their own documentation — it is their preferred method for communicating behavioral distinctions:

```markdown
# Less effective
"Create an endpoint"

# More effective
"Create a health check endpoint in Elysia. Include input
validation with the Elysia type system, return a consistent
error shape, and add a test in the co-located test file."
```

### 4.4 Negative Examples: Pair With Positive Alternatives

Research shows "Don't do X" instructions alone are unreliable — they trigger the "pink elephant" effect where the forbidden behavior becomes more salient. [^pink-elephant] Always pair with the positive alternative:

```markdown
# Less effective
Do not use relative imports for shared packages.

# More effective
Use workspace imports for shared packages. Import from
`@mako/shared` instead of relative paths like `../../packages/shared`.
```

### 4.5 Diminishing Returns

Context rot research [^context-rot] shows that adding examples beyond the useful threshold actively hurts — each additional token forces the model to perform retrieval AND reasoning simultaneously, compounding the penalty.

**Heuristic:** If an example doesn't demonstrate something the model would otherwise get wrong, remove it. Examples should teach distinctions, not confirm defaults.

---

## 5. Context Architecture

### 5.1 The Six-Layer Model

Every model call draws from six distinct layers. Keeping each small and purposeful prevents bloat (adapted from Kubiya [^kubiya]):

| Layer | Content | Persistence | Management |
|---|---|---|---|
| 1. System rules | Behavioral foundation | Persists on disk | CLAUDE.md, rules files |
| 2. Memory | Learned patterns, preferences | Persists across sessions | Memory files, lessons |
| 3. Retrieved docs | Just-in-time knowledge | Session-scoped | Search, file reads |
| 4. Tool schemas | Available capabilities | Config persists | Tool definitions |
| 5. Conversation history | Working session | Session-scoped | Compaction manages |
| 6. Current task | Immediate request | Transient | User prompt |

**Layers 2-5 should include only what helps the current request.** The natural tendency to append everything must be actively resisted.

### 5.2 Progressive Disclosure

Structure context in three tiers:

**Tier 1 — Always loaded** (instruction files, rules, memory)
- Loads every session, survives compaction
- Must be minimal and high-signal
- Target: under 200 lines per file

**Tier 2 — On demand** (skills, docs, search results)
- Loaded only when task requires it
- Can be larger and more detailed
- Discoverable via pointers in Tier 1

**Tier 3 — Deep reference** (scripts, large specs, data)
- Executed or accessed, not loaded into context
- Output consumed, not the source
- Token cost: near zero

```markdown
# Tier 1 entry point (always loaded, ~5 lines)
## API Conventions
Elysia REST API. See `/docs/api/` for details.
Run `bun test` to validate endpoints.

# Tier 2 on-demand file (loaded when working on APIs)
## docs/api/conventions.md
Detailed endpoint patterns, auth flows, error schemas,
validation rules, 3-5 worked examples...

# Tier 3 deep reference (executed, not loaded)
## scripts/validate-api.ts
Runs schema validation against live endpoints
```

### 5.3 The Four Core Strategies

Anthropic and LangChain independently identify the same four strategies that appear across effective AI systems [^anthropic-ce] [^langchain]:

**1. Write Context** — Persist information outside the context window for later retrieval. Scratchpads, structured notes, todo files. Manus maintains a `todo.md` updated throughout task execution to "push global plans into recent attention span." [^manus]

**2. Select Context** — Pull only relevant information into the active window. Just-in-time retrieval via search, file reads, tool calls. Maintain lightweight identifiers (file paths, queries) rather than pre-loading full content.

**3. Compress Context** — Retain only the tokens required. Summarize conversations, trim older turns, hierarchical compression at agent-agent handoffs. Custom compaction instructions preserve what matters.

**4. Isolate Context** — Split context across specialized modules. Subagents handle focused tasks with clean context windows. Each returns condensed summaries (1,000-2,000 tokens), not raw data. LangChain found specialized subagents outperform single-agent approaches despite requiring up to 15x more tokens — the quality gain outweighs token cost. [^langchain]

---

## 6. Artifact Best Practices

### 6.1 Master Instruction Files

The master instruction file (CLAUDE.md, `.cursorrules`, `.github/copilot-instructions.md`) is the highest-leverage context artifact. It loads every session and survives compaction.

**What to include:**

| Include | Why |
|---|---|
| Build/test/lint commands | Can't be guessed (`bun test` vs `npm test`) |
| Code style rules that differ from defaults | Defaults are already known |
| Architecture decisions specific to project | Not inferrable from code |
| Branch naming, PR, commit conventions | Social conventions |
| Common gotchas and non-obvious behaviors | Prevents repeated mistakes |
| Developer environment quirks | Platform-specific issues |

**What to exclude:**

| Exclude | Why |
|---|---|
| What the AI can infer from reading code | Wastes tokens, may contradict reality |
| Standard language conventions | Already known |
| Detailed API docs | Use `@docs/api/` imports or on-demand loading |
| Frequently changing information | Goes stale, causes context clash |
| File-by-file codebase descriptions | Use search tools at runtime |
| Self-evident practices ("write clean code") | No behavioral change |

**Sizing:** Target under 200 lines. 20-80 for small repos, 80-200 for typical services. Beyond 200, adherence drops and maintenance burden increases. [^claude-memory]

**Emphasis for critical rules:** Adding "IMPORTANT" or "YOU MUST" measurably improves adherence for rules that must not be violated. [^claude-bp]

**Diagnostic checks** (from Anthropic [^claude-bp]):
- If the AI keeps ignoring a rule, the file is too long and the rule is getting lost
- If the AI asks questions answered in the file, the phrasing is ambiguous
- If the AI already follows a convention without the instruction, delete it

**Example — well-structured instruction file:**

```markdown
# Mako Poker

## Stack
Bun · Elysia · PostgreSQL · Drizzle ORM · TypeScript · Python CFR Solver

## Commands
- Test: `bun test`
- Type check: `bun run typecheck`
- DB push: `cd apps/api && bun run db:push`

## Architecture
Bun monorepo. `apps/api` (Elysia), `packages/shared` (types),
`solver/` (Python CFR). See `docs/` for details.

## Conventions
- Single quotes, no semicolons, `==` not `===`
- Card ranks use single chars: T not 10
- Import shared code via `@mako/shared`

## IMPORTANT
- Never commit without running all quality gates.
- All card ranks must be single characters (T for ten).
```

### 6.2 Rules and Scoped Conventions

Rules files provide modular instruction sets. Path-scoped rules reduce noise by only loading when the AI works with matching files.

**Design principles:**
- One domain per file (naming, testing, security, API, database)
- Rules should emerge from repeated corrections, not be pre-written speculatively
- No duplication with master instruction file — the instruction file covers workflow; rules cover coding conventions

**Path-scoped rules only load when relevant:**

```yaml
---
paths:
  - "apps/api/src/**/*.ts"
---
# API Development Rules
- All endpoints must include input validation
- Use Elysia's type system for request/response schemas
- Return consistent error shapes: { error: string, code: number }
```

**Rules without `paths` frontmatter load every session** — treat these with the same token budget discipline as the master instruction file.

### 6.3 Skills and Commands

Skills are the primary mechanism for progressive disclosure — the entry point loads first, detail loads on demand.

**Structure:**

```
my-skill/
  SKILL.md           # Main instructions (< 500 lines)
  reference.md       # Loaded on demand via Read tool
  examples.md        # Loaded on demand
  scripts/
    helper.py        # Executed, not loaded into context
```

**Authoring best practices** (from Anthropic [^skill-bp]):
- Write descriptions in third person ("Processes solver output" not "I can help you")
- Include **what AND when** in the description — this drives auto-invocation
- Keep under 500 lines; use supporting files for detail
- Match specificity to fragility — low freedom for migrations, high for reviews
- Provide a default with an escape hatch, not a menu of options
- Challenge every token: "Does the AI really need this explanation?"

**Frontmatter matters — it primes the model before it reads the body:**

```yaml
---
name: review-sql
description: "Reviews SQL queries for injection vulnerabilities,
  N+1 patterns, and missing parameterization. Use when writing
  or modifying any database query."
---
```

### 6.4 Agents and Subagents

Subagents provide context isolation — each operates in a clean context window without inheriting conversation history noise.

| Use main conversation | Use subagents |
|---|---|
| Frequent back-and-forth needed | Task produces verbose output |
| Multiple phases share context | Work is self-contained |
| Quick, targeted change | Context isolation important |
| Latency matters | Parallel execution beneficial |

**Key design principles:**
- **Return summaries, not raw data** — 1,000-2,000 tokens, not full exploration logs
- **Provide thorough context in prompts** — subagents don't see conversation history
- **Parallel execution** for independent research tasks
- **Sequential chaining** when one agent's output informs the next
- **Restrict tool access** to only what each subagent needs

### 6.5 Documentation Files

Documentation consumed by AI should follow these principles:

**1. Structured over prose.** Use headers, bullets, tables. Not paragraphs.

**2. Atomic and focused.** One concept per document. A doc about "CFR Solver Architecture" should not also cover database migrations.

**3. Consistent terminology.** Pick one term per concept and use it everywhere. Mixing "API endpoint," "URL," "route," and "path" confuses the model into treating them as distinct concepts.

**4. Include verification criteria.** Tests, expected outputs, examples of correct behavior. This is "the single highest-leverage thing you can do" for AI context. [^claude-bp]

**5. Reference existing patterns.** "Follow the pattern in `auth-service.ts`" is more effective than describing the pattern abstractly.

**6. Frontmatter for machine readability.** YAML frontmatter makes docs queryable and filterable:

```yaml
---
title: "API Rate Limiting"
type: guide              # architecture | api | guide | decision | plan
status: active           # draft | active | archived | deprecated
area: api                # domain area
created: 2026-01-15
updated: 2026-03-01
tags: [performance, security]
related:
  - docs/api/conventions.md
  - docs/architecture/system-overview.md
---
```

**Why each field matters for AI:**

| Field | AI Use |
|---|---|
| `type` | Filter by document category |
| `status` | Ignore archived/deprecated docs automatically |
| `updated` | Prioritize recent information over stale |
| `area` | Map to codebase domains for targeted retrieval |
| `tags` | Cross-cutting discovery |
| `related` | Explicit links without requiring search |

### 6.6 Memory and Persistence

Memory files store patterns learned across sessions. Key constraint: most systems only load a limited amount at session start (e.g., first 200 lines of a memory index file).

**What to store:**

| Store | Don't Store |
|---|---|
| Stable patterns confirmed across interactions | Session-specific context |
| Architectural decisions, important paths | Incomplete/unverified information |
| User workflow preferences | Anything duplicating instruction files |
| Solutions to recurring problems | Speculative conclusions |
| Explicit user requests ("always use bun") | Temporary task state |

**The Lessons-to-Rules Pipeline:**

Corrections should graduate from transient to permanent through a structured pipeline:

1. **Correction happens** — Log to a lessons file with date, area, lesson
2. **Pattern repeats 3+ times** — Graduate to a matching rules file
3. **Rule recorded** — Remove from active lessons

This prevents both lesson loss (corrections forgotten) and rule bloat (every one-off issue becomes a permanent rule).

**Structured note-taking for long tasks:**

Both Anthropic and the Manus team independently converged on maintaining persistent notes during long-horizon tasks. Writing a `todo.md` or progress file that gets updated throughout execution "pushes global plans into recent attention span," directly counteracting the lost-in-the-middle effect. [^manus] [^anthropic-ce]

---

## 7. Signal vs. Noise

### 7.1 Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| **Kitchen sink session** | One task, drift to unrelated, drift back | Clear context between unrelated tasks |
| **Correction spiral** | Context polluted with failed approaches | After 2 failures, clear and rewrite initial prompt |
| **Over-specified instructions** | File too long, important rules lost in noise | Prune ruthlessly; move details to rules/skills |
| **Infinite exploration** | Unscoped investigation fills context | Scope narrowly or delegate to subagents |
| **Monolithic docs** | 85K doc loaded when 5K overview sufficed | Split into overview + detail files |
| **Stale archive in search** | Archived files pollute search results | Separate archives, filter by status |
| **Offering too many options** | AI can't choose without context you lack | Provide a default with one named escape hatch |
| **Duplicate enforcement** | Rules duplicate what tooling enforces | Tooling enforces; documents guide |
| **Nested reference chains** | 3+ levels of indirection, partial reads | Keep references one level deep |
| **Time-sensitive conditionals** | "Before August 2025, use X" goes stale | Use "current / deprecated" framing |
| **Inconsistent terminology** | Synonyms treated as distinct concepts | One term per concept, no synonyms |

### 7.2 What Helps Performance

Ranked by evidence strength:

1. **Verification criteria** — Tests, expected outputs, examples of correct behavior. "The single highest-leverage thing." [^claude-bp]
2. **Specific file references** — `apps/api/src/services/auth-service.ts:42` over "the auth service"
3. **Existing pattern references** — "Follow the pattern in X" over abstract descriptions
4. **Subagents for investigation** — Explore in separate context windows, return summaries
5. **Frontmatter filtering** — Query only `status: active` docs, not the entire vault
6. **Right-sized documents** — 100-400 lines, focused on one concept
7. **Stable prompt prefixes** — Avoid dynamic content (timestamps, random IDs) in instruction files; it invalidates caching and increases costs [^manus]
8. **Keep failures visible** — Don't hide errors or retries from the model. "When models see failed actions, they implicitly update beliefs and avoid repeating mistakes." [^manus]

---

## 8. Staleness and Maintenance

### 8.1 Staleness Vectors

| Vector | Mechanism | Mitigation |
|---|---|---|
| Code changes, docs don't | Implementation diverges from docs | Doc update triggers in instruction files |
| Compaction loses instructions | Conversation-only rules vanish | Write rules to files, not conversation |
| Context continuation skips re-read | Standing rules violated after limit | Use hooks for critical re-injection |
| Memory file grows past limits | Content past threshold silently dropped | Keep concise, use topic files |
| Archived docs in search path | Stale information returned | Separate archives, filter by status |
| Conflicting rules | Two rules contradict; AI picks arbitrarily | Periodic audit of all context files |

### 8.2 Automated Maintenance Patterns

**1. Session start hooks** — Inject fresh context at every session. Use compaction matchers for post-compaction re-injection:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "compact",
      "command": "cat tasks/current-sprint.md"
    }]
  }
}
```

**2. Post-tool-use hooks** — Auto-format, auto-lint after every file edit.

**3. Document update triggers** — Maintain a table mapping code changes to required doc updates (convention enforced by instruction).

**4. Frontmatter `updated` dates** — Query for docs older than a threshold to surface staleness.

**5. Review cadence** — Treat instruction files like code: review when things go wrong, prune regularly, test by observing behavior changes. [^claude-bp]

### 8.3 Maintenance Checklist

```
[ ] Master instruction file — still under 200 lines? Every line earning its place?
[ ] Rules files — any conflicts? Any stale rules?
[ ] Memory files — under size limits? Still accurate?
[ ] Skills — descriptions still accurate? Any unused?
[ ] Docs frontmatter — query for stale docs (outdated `updated` dates)
[ ] Archived content — moved out of active search path?
[ ] Context loading — start a fresh session and verify rules are followed
```

---

## 9. Validation Reference

Use this section to audit any context artifact. For each artifact type, verify the applicable criteria.

### All Context Files

- [x] Clear header hierarchy (H1, H2, H3, no skipped levels)
- [x] One idea per paragraph or list item
- [x] Consistent terminology throughout (no synonyms for the same concept)
- [x] Critical information at the beginning (and echoed at end for long docs)
- [x] No walls of text — use lists, tables, or code blocks
- [x] Tables for routing/mapping, lists for rules, prose for reasoning
- [x] Examples where the output format is non-obvious (3-5 max)
- [x] No duplicate content with other context files
- [x] No instructions the AI would follow without being told

### Master Instruction Files (CLAUDE.md)

- [ ] Under 200 lines
- [ ] Build/test/lint commands included
- [ ] Project-specific conventions only (not language defaults)
- [ ] Uses imports (`@path`) for detailed reference, not inline content
- [ ] "IMPORTANT" emphasis on rules that must not be violated
- [ ] No file-by-file codebase descriptions
- [ ] No frequently changing information

### Rules Files

- [ ] One domain per file
- [ ] Path-scoped where applicable (paths in frontmatter)
- [ ] Emerged from repeated corrections, not speculative pre-writing
- [ ] No duplication with master instruction file
- [ ] Concise — rules, not tutorials

### Skills

- [ ] Under 500 lines for main file
- [ ] Description: third person, includes what AND when
- [ ] Supporting files used for detailed reference (progressive disclosure)
- [ ] Default behavior with escape hatch, not a menu of options
- [ ] Every token justified ("Does the AI really need this?")
- [ ] Frontmatter includes `name` and `description`

### Documentation Files

- [x] YAML frontmatter with `title`, `type`, `status`, `area`, `created`, `updated`
- [x] 100-400 lines (on-demand reference can go to 800)
- [x] Atomic: one concept per document
- [x] Includes verification criteria (tests, expected output)
- [x] References existing patterns where applicable
- [x] Tags for cross-cutting discovery
- [x] `related` field links to connected docs

### Agents / Subagents

- [ ] Clear, specific description driving auto-invocation
- [ ] Tool access restricted to what's needed
- [ ] Returns summaries (1,000-2,000 tokens), not raw data
- [ ] Prompt includes full context (no assumed conversation history)

---

## 10. Sources

### Primary Sources

[^karpathy]: Andrej Karpathy. "Context Engineering." [x.com/karpathy/status/1937902205765607626](https://x.com/karpathy/status/1937902205765607626)

[^anthropic-ce]: Anthropic Engineering. "Effective Context Engineering for AI Agents." [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

[^anthropic-bp]: Anthropic. "Claude Prompting Best Practices." [platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

[^claude-bp]: Anthropic. "Claude Code Best Practices." [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)

[^claude-memory]: Anthropic. "Claude Code Memory." [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)

[^skill-bp]: Anthropic. "Skill Authoring Best Practices." [platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

[^context-rot]: Chroma Research. "Context Rot." [research.trychroma.com/context-rot](https://research.trychroma.com/context-rot)

[^lost-in-middle]: Liu et al. "Lost in the Middle: How Language Models Use Long Contexts." ACL 2024. [aclanthology.org/2024.tacl-1.9/](https://aclanthology.org/2024.tacl-1.9/)

[^mit-bias]: MIT News. "Unpacking Large Language Model Bias." 2025. [news.mit.edu/2025/unpacking-large-language-model-bias-0617](https://news.mit.edu/2025/unpacking-large-language-model-bias-0617)

[^jetbrains]: JetBrains Research. "Efficient Context Management for Coding Agents." [blog.jetbrains.com/research/2025/12/efficient-context-management/](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)

### Industry Sources

[^manus]: Manus. "Context Engineering Lessons from Building Manus." [manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)

[^langchain]: LangChain. "Context Engineering for Agents." [blog.langchain.com/context-engineering-for-agents/](https://blog.langchain.com/context-engineering-for-agents/)

[^factory]: Factory.ai. "The Context Window Problem." [factory.ai/news/context-window-problem](https://factory.ai/news/context-window-problem)

[^kubiya]: Kubiya. "Context Engineering Best Practices 2025." [kubiya.ai/blog/context-engineering-best-practices](https://www.kubiya.ai/blog/context-engineering-best-practices)

[^humanlayer]: HumanLayer. "Writing a Good CLAUDE.md." [humanlayer.dev/blog/writing-a-good-claude-md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

[^cloudflare]: Cloudflare Blog. "Markdown for Agents." [blog.cloudflare.com/markdown-for-agents/](https://blog.cloudflare.com/markdown-for-agents/)

[^schmid]: Philipp Schmid. "The New Skill in AI is Context Engineering." [philschmid.de/context-engineering](https://www.philschmid.de/context-engineering)

### Research Sources

[^fewshot-research]: Prompt Engineering Guide. "Few-Shot Prompting." [promptingguide.ai/techniques/fewshot](https://www.promptingguide.ai/techniques/fewshot)

[^promptlayer]: PromptLayer. "Does Few-Shot Learning Help LLM Performance in Code Synthesis?" Citing arXiv 2412.02906. [arxiv.org/html/2412.02906v1](https://arxiv.org/html/2412.02906v1)

[^pink-elephant]: 16x Engineer. "The Pink Elephant Problem: Why Negative Instructions Fail." [eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis](https://eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis)

[^format-research]: Improving Agents. "Which Table Format Do LLMs Understand Best?" [improvingagents.com/blog/best-input-data-format-for-llms/](https://www.improvingagents.com/blog/best-input-data-format-for-llms/)

[^doc-structure]: Paradigm Media Networks. "LLM Content Structure Guide 2025." [paradigmmedianetworks.com/llm-content-structure-guide-2025/](https://paradigmmedianetworks.com/llm-content-structure-guide-2025/)

[^cursor-study]: Jiang & Nam. "Beyond the Prompt: An Empirical Study of Cursor Rules." MSR 2026. [arxiv.org/abs/2512.18925](https://arxiv.org/abs/2512.18925)

[^arize]: Arize AI. "CLAUDE.md Best Practices Learned from Optimizing Claude Code." [arize.com/blog/claude-md-best-practices-learned-from-optimizing-claude-code-with-prompt-learning/](https://arize.com/blog/claude-md-best-practices-learned-from-optimizing-claude-code-with-prompt-learning/)

### Additional Reading

- Martin Fowler. "Context Engineering for Coding Agents." [martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- Elastic. "Context Engineering vs Prompt Engineering." [elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering](https://www.elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering)
- NearForm. "Beyond Prompt Engineering: The Shift to Context Engineering." [nearform.com/digital-community/beyond-prompt-engineering-the-shift-to-context-engineering/](https://nearform.com/digital-community/beyond-prompt-engineering-the-shift-to-context-engineering/)
- Anthropic. "Long Context Prompting Tips." [docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips)
- Google Developers. "Architecting Efficient Context-Aware Multi-Agent Framework." [developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
