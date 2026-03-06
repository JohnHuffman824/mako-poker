---
title: "Plan 2: AI Development Infrastructure"
type: plan
status: active
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, plan, ai-infrastructure, claude-code, rules, skills, agents, context-engineering]
related: [poker-assistant/00-index, 01-repo-cleanup, 03-mvp-implementation]
---

# Plan 2: AI Development Infrastructure

> Build a `.claude/` infrastructure and documentation system that makes Claude Code maximally effective for developing the Poker Assistant. All future development happens through Claude Code — this plan sets the foundation for quality, consistency, and velocity.

## Goal

Create a comprehensive AI development infrastructure adapted from PlaySmith's mature setup. The system should: automatically enforce coding standards, keep documentation current, catch AI-generated errors early, support strict TDD, and provide the right commands/agents for efficient development. Every context artifact built here must pass validation against the context engineering guide.

## Prerequisites

- [[01-repo-cleanup]] is complete (main branch is clean)
- PlaySmith's `.claude/` infrastructure available as reference at `~/play-smith/.claude/`

## Decisions Log

| Question | Decision | Rationale |
|----------|----------|-----------|
| Context engineering doc location | `docs/guides/context-engineering.md` | Same path as PlaySmith for consistency |
| Research docs to port | Visual design research + style guide foundations | Cross-project value for mobile UI |
| CLAUDE.md approach | Full rewrite from scratch | Post-cleanup, ~70% of current content is stale |
| Commands priority | brainstorm, write-plan, execute-plan, tdd, debug, commit, session-summary, context-audit | Based on actual usage patterns |
| Intelligent compact | Include but lower priority | User doesn't use it much |
| Verify command | Include but lower priority | User doesn't use it much |
| TDD enforcement | Strict — AI must reference TDD rule automatically | Core development methodology |
| Domain-specific rules | Create `poker-domain.md` and `llm-integration.md` with clear purpose, context-audit them | Needed before Plan 3 features |
| Agents to port | General-purpose only (codebase-analyzer, test-generator, test-fixer, file-reviewer, doc-navigator) | Skip PlaySmith-specific (block-*, frontend-design) |
| Plugin set | Same as PlaySmith | Proven configuration |
| Lessons infrastructure | Yes — full lessons-to-rules pipeline | Prevents repeated mistakes |
| Style guide | Port and adapt PlaySmith's visual design research + style foundations | Applicable to mobile UI |
| All artifacts | Must pass context engineering guide validation | Quality gate for every file we create |

## Guiding Principle

**The context engineering guide is the constitution.** Every rule, skill, agent, and documentation file created in this plan must be validated against `docs/guides/context-engineering.md`. Key principles to enforce:

- Token budget is zero-sum — every line must earn its place
- Always-loaded files under 200 lines
- Skills under 500 lines
- Tables for routing, lists for rules, prose for reasoning
- Critical info at beginning (and echoed at end for long docs)
- Examples over exhaustive rules (3-5 max)
- One domain per rule file
- Path-scoped rules where applicable

---

## Phase 1: Foundation Documents

Port the reference documents that govern how all other artifacts are built.

### Task 1.1: Port context engineering guide

Copy `~/play-smith/docs/guides/context-engineering.md` to `docs/guides/context-engineering.md`.

Adapt:
- Remove PlaySmith-specific references (block architecture, Hono, etc.)
- Update stack references to Mako Poker (Bun, Elysia, React Native/Expo, Claude API, PostgreSQL/Drizzle)
- Keep all research citations and principles intact — these are universal
- Update the example snippets to use Mako Poker patterns where appropriate

Verify: Document passes its own validation checklist (Section 9).

### Task 1.2: Port visual design research

Copy `~/play-smith/docs/research/VISUAL_DESIGN_RESEARCH.md` to `docs/research/visual-design-research.md`.

Adapt:
- Remove PlaySmith-specific application notes (cost estimator references, construction professionals)
- Reframe practical applications for mobile poker UI (React Native context)
- Keep all psychology research, principles, and product references intact
- Update "Choosing the Right Level" table for Poker Assistant screens (chat interface, preset config, history, range display)

### Task 1.3: Port and adapt style guide foundations

Create `docs/guides/style-guide.md` adapted from PlaySmith's design system.

Focus on what applies to React Native/Expo mobile:
- Design philosophy (refined minimalism — carries over)
- Color system (adapt for poker: card suits, position colors, confidence indicators)
- Typography scale (adapt for mobile screens)
- Spacing system (adapt for touch targets, mobile density)
- Dark mode considerations (poker apps typically support dark mode)
- Component patterns relevant to mobile (cards, lists, chat bubbles, action sheets)

Remove what doesn't apply:
- CSS-specific patterns (React Native uses StyleSheet)
- Web-specific layout (CSS Grid, etc.)
- PlaySmith-specific components (blocks, canvas, etc.)

### Task 1.4: Create satellite style docs (if needed)

Evaluate whether separate docs are needed for:
- Animation patterns for React Native (Reanimated/Moti)
- Component catalog (defer until Plan 3 Phase 4 when building UI)
- Interaction patterns for mobile

Decision: Create only if the style guide exceeds 400 lines. Otherwise keep consolidated.

---

## Phase 2: CLAUDE.md Rewrite

### Task 2.1: Write new CLAUDE.md from scratch

Target: under 200 lines per context engineering guide.

**Structure (WHAT-WHY-HOW framework):**

```
# Mako Poker

## Project Overview (WHAT)
- Poker Assistant: mobile-first conversational GTO coach
- Three-layer architecture: Mobile App -> Backend API -> GTO Data Layer
- Two Claude calls per query: Parse (NL -> PokerScenario) -> Interpret (solver data -> explanation)

## Stack
- Runtime: Bun
- API: Elysia with PostgreSQL/Drizzle ORM
- Mobile: React Native / Expo (planned)
- AI: Claude API (parse + interpret)
- Solver: Python CFR (offline computation)
- Shared: @mako/shared TypeScript package

## Commands (HOW)
- bun install, bun test, bun run typecheck
- bun run dev:api (starts DB + API)
- cd apps/api && bun run db:push
- bun run db:start / db:stop / db:logs

## Architecture
- Monorepo: apps/api, packages/shared, solver/
- @mako/shared for cross-package imports
- Service layer pattern: routes -> services -> db
- Kept from v1: hand-evaluator, position-service, auth-service

## Conventions
- Reference .claude/coding-conventions.md
- KISS is king
- Strict TDD (red -> green -> refactor)
- Single quotes, no semicolons, tabs, == not ===
- Card ranks: single char ('T' not '10')

## IMPORTANT
- All code changes require TDD — no production code without failing test
- Run verify before claiming done
- Update docs when code changes (see doc-triggers rule)
- No AI attribution in commits
- Commit frequently, push after committing
```

Remove all stale content:
- Frontend architecture (apps/web removed)
- Game flow documentation
- Game state / pot management / betting details
- References to removed services, routes, domain files
- Stale database table descriptions
- Common gotchas that reference removed code

### Task 2.2: Validate CLAUDE.md

Run context audit against context engineering guide:
- [ ] Under 200 lines
- [ ] Build/test/lint commands included
- [ ] Project-specific conventions only
- [ ] No file-by-file codebase descriptions
- [ ] No frequently changing information
- [ ] IMPORTANT emphasis on critical rules
- [ ] Clear header hierarchy

---

## Phase 3: Rules Files

One domain per file. Path-scoped where applicable. Each rule must emerge from a real need, not speculation.

### Task 3.1: Update coding conventions

Review and update `.claude/coding-conventions.md`:
- Remove any web-frontend-specific conventions
- Add React Native conventions (StyleSheet patterns, platform-specific code)
- Add Claude API conventions (structured output, tool use patterns)
- Ensure it stays focused on code style, not workflow (workflow goes in CLAUDE.md)
- Verify no duplication with CLAUDE.md

### Task 3.2: Create testing rule

Create `.claude/rules/testing.md`:

Adapt from PlaySmith's testing rule:
- Runner: Bun test (not Jest, not Vitest)
- TDD required: Red -> Green -> Refactor using `/tdd` skill
- Directory structure: tests mirror `src/` (e.g., `src/services/auth-service.ts` -> `test/services/auth-service.spec.ts`)
- Test structure: describe/it from bun:test with beforeEach setup
- No mocks — use real implementations
- Anti-patterns: no test.skip without tracking, no shared mutable state, no testing internals
- Reference skills: `/tdd`, `/debug`

### Task 3.3: Create services rule

Create `.claude/rules/services.md`:

Adapt from PlaySmith's services rule:
- Role: business logic between API routes and data access
- Pattern: API Route -> Service -> DB/Drizzle
- No HTTP concerns in services
- Throw domain-specific errors, let routes translate to HTTP
- One service per domain area
- File naming: kebab-case (auth-service.ts, gto-query-service.ts)
- Key services post-cleanup: auth-service, position-service
- Future services: gto-query-service, equity-calculator, scenario-parser, strategy-interpreter

### Task 3.4: Create API layer rule

Create `.claude/rules/api-layer.md`:

Adapt from PlaySmith's API layer rule:
- Framework: Elysia (not Hono like PlaySmith)
- Route organization: one file per resource area
- Input validation with Elysia's built-in validation (t.Object schema)
- Consistent error responses
- JWT auth via Elysia plugin
- SSE for streaming Claude responses (future)

### Task 3.5: Create skill routing rule

Create `.claude/rules/skill-routing.md`:

**Rule:** Skill exists for task -> Use it. No exceptions.

| Trigger | Skill |
|---------|-------|
| New feature, unclear requirements | `/brainstorm` |
| Writing code, adding functionality | `/tdd` |
| Bug, error, failure | `/debug` |
| Writing implementation plan | `/write-plan` |
| Executing existing plan | `/execute-plan` |
| About to say "done" | `/verify` |
| Ready to commit | `/commit` |
| End of session | `/session-summary` |
| Auditing context quality | `/context-audit` |
| Exploring codebase | `/research-codebase` |

### Task 3.6: Create subagent routing rule

Create `.claude/rules/subagent-routing.md`:

| Need | Agent |
|------|-------|
| Code analysis, patterns | `codebase-analyzer` |
| Find specific code/files | `codebase-locator` (Explore agent) |
| Generate tests | `test-generator` |
| Fix failing tests | `test-fixer` |
| Review file quality | `file-reviewer` |
| Find documentation | `doc-navigator` |

Launch concurrently when tasks are independent.

### Task 3.7: Create doc triggers rule

Create `.claude/rules/doc-triggers.md`:

**General rule:** Every functional change must be accompanied by documentation updates.

Path-specific trigger table:

| Code Change | Update |
|-------------|--------|
| `apps/api/src/services/*` | Update CLAUDE.md architecture section if new service |
| `apps/api/src/routes/*` | Update CLAUDE.md routes section |
| `apps/api/src/db/schema.ts` | Update any DB documentation |
| `packages/shared/src/types/*` | Update CLAUDE.md shared package section |
| `packages/shared/src/constants/*` | Update CLAUDE.md if constants change |
| `.claude/rules/*` | Run context audit on changed file |
| `.claude/commands/*` | Update skill routing table if new skill |
| `docs/plans/*` | Update related plan cross-references |

### Task 3.8: Create poker domain rule

Create `.claude/rules/poker-domain.md`:

Poker-specific conventions:
- Card notation: single-char ranks ('T' not '10'), suits as 's','h','d','c'
- Hand notation: "AKs" (suited), "AKo" (offsuit), "AK" (both)
- Position system: BTN, SB, BB, UTG, UTG+1, UTG+2, MP, HJ, CO
- Position ordering: use POSITION_NAMES from @mako/shared
- Stack sizes always in BB (big blinds)
- GTO data: never hallucinate solver numbers — all from precomputed DB
- Action notation: fold, call, raise, all-in (lowercase in code, display-case in UI)
- Street names: preflop, flop, turn, river

### Task 3.9: Create LLM integration rule

Create `.claude/rules/llm-integration.md`:

Claude API conventions for the Poker Assistant:
- Two-phase pattern: Parse (NL -> structured) then Interpret (data -> NL)
- Parse phase uses tool_use / function calling for structured extraction
- Interpret phase uses system prompt + user context + solver data
- Never let Claude generate GTO numbers — all numbers from DB
- Confidence levels: high (exact match), medium (interpolated), lower (extrapolated)
- Cost optimization: use appropriate model tier for each phase
- Prompt structure: system prompt -> user question -> solver data -> format instructions
- Error handling: graceful degradation, clarifying questions for ambiguous input

### Task 3.10: Create obsidian conventions rule

Create `.claude/rules/obsidian-conventions.md`:

Adapt from PlaySmith's:
- Wiki-links `[[note]]` for vault content
- Standard markdown `[text](url)` for external URLs only
- Frontmatter schema: title, type, status, area, created, updated, tags, related
- Status values: draft, active, archived, deprecated
- Type values: plan, guide, research, decision, progress, session
- `docs/` directory is symlinked into Obsidian vault at `~/vault/projects/mako-poker/`

### Task 3.11: Validate all rules

Run context audit on every rule file:
- [ ] One domain per file
- [ ] Under 200 lines (rules should be concise)
- [ ] No duplication with CLAUDE.md or other rules
- [ ] Tables for routing, lists for rules
- [ ] Path-scoped where applicable
- [ ] Emerged from real needs, not speculation

---

## Phase 4: Commands (Skills)

Commands invoked via `/command-name`. Each must have clear purpose and stay under 500 lines.

### Task 4.1: Port core planning commands

Port and adapt from PlaySmith:

**`/brainstorm`** — `.claude/commands/brainstorm.md`
- Collaborative design through Socratic questioning
- ONE QUESTION AT A TIME
- YAGNI ruthlessly, explore alternatives before deciding
- Document output to `docs/plans/`
- Adapt: remove PlaySmith-specific patterns, add poker domain context

**`/write-plan`** — `.claude/commands/write-plan.md`
- Convert designs into implementation plans with TDD steps
- Iron law: one action per step, exact file paths, complete code, TDD always
- Save to `docs/plans/YYYY-MM-DD-<feature>-implementation.md`
- Adapt: update stack references, remove block-specific patterns

**`/execute-plan`** — `.claude/commands/execute-plan.md`
- Execute plans in batches of 3 with checkpoints
- Track progress with TaskCreate/TaskUpdate
- Stop when blocked, verify every step
- Adapt: update quality gate commands for Mako Poker

### Task 4.2: Port development commands

**`/tdd`** — `.claude/commands/tdd.md`
- STRICT ENFORCEMENT: NO PRODUCTION CODE WITHOUT FAILING TEST
- Cycle: RED (failing test) -> GREEN (minimal implementation) -> REFACTOR -> REPEAT
- Test locations: mirror src/ structure under test/
- Adapt: Bun test patterns, Elysia testing patterns, poker domain test examples
- This is the most important command — referenced automatically by skill routing

**`/debug`** — `.claude/commands/debug.md`
- Systematic: TYPE -> REPRODUCE -> EVIDENCE -> TRACE -> HYPOTHESIS -> TEST -> VERIFY
- NO FIXES WITHOUT ROOT CAUSE
- Levels: Quick (obvious), Standard (most), Deep (multi-layer), Architectural (design flaw)
- Adapt: Mako-specific debugging (Elysia routes, Drizzle queries, Claude API calls)

**`/commit`** — `.claude/commands/commit.md`
- INSPECT -> STAGE -> ANALYZE -> COMMIT -> VERIFY
- Conventional format: `<type>: <brief summary>`
- IMPORTANT: No AI attribution — no Co-Authored-By, no AI signatures
- Push after committing

**`/verify`** — `.claude/commands/verify.md`
- Run all quality gates before claiming done
- Gates: `bun test`, `bun run typecheck`
- NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
- Adapt: update gate commands for Mako Poker stack

### Task 4.3: Port session management commands

**`/session-summary`** — `.claude/commands/session-summary.md`
- Capture session to Obsidian vault at `~/vault/claude-sessions/`
- Include: objective, what was done, key decisions, next steps
- Frontmatter with date, project, tags
- This is the global command referenced in the user's CLAUDE.md

**`/context-audit`** — `.claude/commands/context-audit.md`
- Read `docs/guides/context-engineering.md`
- Audit provided file against context engineering principles
- Present findings with specific violations and fixes
- Used to validate every artifact created in this plan

**`/intelligent-compact`** — `.claude/commands/intelligent-compact.md`
- Compact session into resumable progress file
- Save to `docs/progress/YYYY-MM-DD-HH-MM-<topic>.md`
- Minimum viable context for maximum resumption velocity
- Adapt: update stack references, output location

### Task 4.4: Port exploration command

**`/research-codebase`** — `.claude/commands/research-codebase.md`
- Deep codebase exploration using subagents
- Adapt: update for Mako Poker directory structure

### Task 4.5: Validate all commands

Context audit each command:
- [ ] Under 500 lines
- [ ] Description: third person, includes what AND when
- [ ] Default behavior with escape hatch
- [ ] Every token justified
- [ ] No PlaySmith-specific patterns remaining

---

## Phase 5: Agents

Subagent definitions for specialized work. Each returns summaries, not raw data.

### Task 5.1: Port general-purpose agents

Port and adapt from PlaySmith:

**`codebase-analyzer`** — `.claude/agents/codebase-analyzer.md`
- Analyze code patterns and architecture
- Adapt: remove PlaySmith-specific patterns

**`test-generator`** — `.claude/agents/test-generator.md`
- Generate tests for services and API endpoints
- Adapt: Bun test, Mako Poker test patterns, poker domain examples

**`test-fixer`** — `.claude/agents/test-fixer.md`
- Diagnose and fix failing tests
- Adapt: Mako Poker stack-specific debugging

**`file-reviewer`** — `.claude/agents/file-reviewer.md`
- Review individual files for quality against coding conventions
- Adapt: reference Mako Poker's coding-conventions.md

**`doc-navigator`** — `.claude/agents/doc-navigator.md`
- Find and retrieve relevant documentation
- Adapt: Mako Poker doc structure (docs/plans, docs/guides, docs/research)

### Task 5.2: Validate all agents

Context audit each agent:
- [ ] Clear, specific description
- [ ] Tool access restricted to what's needed
- [ ] Returns summaries (1,000-2,000 tokens), not raw data
- [ ] Prompt includes full context (no assumed conversation history)

---

## Phase 6: Project Configuration

### Task 6.1: Create settings.json

Create `.claude/settings.json` with same plugin set as PlaySmith:

```json
{
  "enabledPlugins": {
    "backend-development": true,
    "javascript-typescript": true,
    "security-guidance": true,
    "developer-essentials": true,
    "code-documentation": true,
    "codebase-cleanup": true,
    "unit-testing": true,
    "frontend-design": true,
    "api-scaffolding": true,
    "performance-testing-review": true,
    "llm-application-dev": true,
    "database-design": true,
    "error-diagnostics": true
  }
}
```

### Task 6.2: Create lessons infrastructure

Create `docs/lessons.md`:

```markdown
# Active Lessons

Corrections and patterns discovered during development. After 3+ repeats, graduate to a rules file.

| Date | Area | Lesson | Source | Repeats |
|------|------|--------|--------|---------|
| | | | | |

## Graduation Process

1. Correction happens -> Log here with date, area, lesson
2. Pattern repeats 3+ times -> Graduate to matching .claude/rules/ file
3. Rule recorded -> Remove from active lessons
```

### Task 6.3: Set up Obsidian vault symlink

Ensure `docs/` is symlinked into the vault:
```bash
ln -sf ~/mako-poker/docs ~/vault/projects/mako-poker
```

Verify the symlink works and Obsidian can navigate to plan files.

### Task 6.4: Update auto-memory

Review and update memory files at the Claude personal memory directory:
- Capture key architectural decisions from the poker-assistant design docs
- Note the context engineering guide as the governance document
- Link to planning docs

---

## Phase 7: Final Verification

### Task 7.1: Context audit all artifacts

Run `/context-audit` on every file created in this plan:

**Always-loaded files (must be under 200 lines):**
- [ ] `CLAUDE.md`
- [ ] `.claude/coding-conventions.md`
- [ ] All `.claude/rules/*.md` files

**On-demand files (under 500 lines):**
- [ ] All `.claude/commands/*.md` files
- [ ] All `.claude/agents/*.md` files

**Reference docs (under 800 lines):**
- [ ] `docs/guides/context-engineering.md`
- [ ] `docs/guides/style-guide.md`
- [ ] `docs/research/visual-design-research.md`

### Task 7.2: Integration test

Verify the infrastructure works as a system:
- [ ] Start fresh Claude Code session
- [ ] Confirm CLAUDE.md loads correctly
- [ ] Confirm rules load when working in relevant paths
- [ ] Test `/tdd` command triggers correctly
- [ ] Test `/brainstorm` command works
- [ ] Test `/commit` command works
- [ ] Test `/session-summary` command works
- [ ] Test `/context-audit` against a sample file
- [ ] Verify skill routing table covers common task types
- [ ] Verify subagent routing dispatches correctly

### Task 7.3: Check for conflicts

- [ ] No duplication between CLAUDE.md and rules files
- [ ] No contradictory instructions across files
- [ ] No orphaned references to PlaySmith patterns
- [ ] Consistent terminology across all artifacts
- [ ] All file references and paths are correct for Mako Poker

### Task 7.4: Commit and push

```
set up AI development infrastructure for poker assistant

Port and adapt PlaySmith's .claude/ infrastructure: context engineering
guide, CLAUDE.md rewrite, 10 rules files, 9 commands, 5 agents,
settings, lessons pipeline. Visual design research and style guide
ported for mobile UI reference.

All artifacts validated against context engineering guide.
```

---

## What Gets Created

```
mako-poker/
  .claude/
    coding-conventions.md          # Updated (remove web, add RN/Claude API)
    settings.json                  # Plugin configuration
    rules/
      testing.md                   # TDD enforcement, Bun test patterns
      services.md                  # Service layer conventions
      api-layer.md                 # Elysia route conventions
      skill-routing.md             # Task -> skill mapping table
      subagent-routing.md          # Need -> agent mapping table
      doc-triggers.md              # Code change -> doc update mapping
      poker-domain.md              # Card notation, positions, GTO conventions
      llm-integration.md           # Claude API patterns, two-phase design
      obsidian-conventions.md      # Vault structure, frontmatter, linking
    commands/
      brainstorm.md                # Collaborative design exploration
      write-plan.md                # Design -> implementation plan
      execute-plan.md              # Execute plan in batches
      tdd.md                       # Strict TDD workflow
      debug.md                     # Systematic debugging
      commit.md                    # Conventional commits
      verify.md                    # Quality gates
      session-summary.md           # Obsidian session capture
      context-audit.md             # Validate against CE guide
      intelligent-compact.md       # Session compaction
      research-codebase.md         # Deep exploration
    agents/
      codebase-analyzer.md         # Code pattern analysis
      test-generator.md            # Test generation
      test-fixer.md                # Test diagnosis and repair
      file-reviewer.md             # File quality review
      doc-navigator.md             # Documentation discovery
  docs/
    guides/
      context-engineering.md       # The constitution (ported from PlaySmith)
      style-guide.md               # Design system for mobile UI
    research/
      visual-design-research.md    # UX psychology reference
    lessons.md                     # Active lessons pipeline
  CLAUDE.md                        # Complete rewrite (<200 lines)
```

## Risk Mitigation

- Every artifact validated against context engineering guide before finalizing
- PlaySmith originals preserved — we're copying and adapting, not moving
- Phase-by-phase verification prevents cascading errors
- Context audit command available immediately to validate future changes
- Lessons pipeline catches issues that slip through initial setup

## Dependencies

- **Depends on**: [[01-repo-cleanup]] (needs clean codebase to write accurate CLAUDE.md)
- **Blocks**: [[03-mvp-implementation]] (infrastructure should be in place before features)
