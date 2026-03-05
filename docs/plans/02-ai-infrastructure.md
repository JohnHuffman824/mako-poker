---
title: "Plan 2: AI Development Infrastructure"
type: plan
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, plan, ai-infrastructure, claude-code, rules, skills, agents]
related: [poker-assistant/00-index, 01-repo-cleanup, 03-mvp-implementation]
---

# Plan 2: AI Development Infrastructure

> Set up Claude Code rules, skills, agents, and project configuration to accelerate development of the Poker Assistant. Modeled after the PlaySmith project's mature AI infrastructure.

## Goal

Build a `.claude/` infrastructure tailored to the Poker Assistant that makes Claude Code maximally effective — routing to the right skills, enforcing project conventions, and providing domain-specific agents for poker engine work, LLM integration, and mobile development.

## Prerequisites

- [[01-repo-cleanup]] is complete (main branch is clean)
- PlaySmith's `.claude/` infrastructure available as reference

## Lessons from PlaySmith

PlaySmith has a mature setup with:
- **Rules files** — conventions enforced automatically (naming, testing, services, types, styles, etc.)
- **Skill routing** — deterministic mapping from task type to skill
- **Subagent routing** — specialized agents for code review, debugging, testing, etc.
- **Custom commands** — `/write-plan`, `/execute-plan`, `/tdd`, `/debug`, `/verify`, `/brainstorm`
- **Doc triggers** — auto-update docs when related code changes
- **Self-improvement loop** — lessons learned → graduated to rules
- **Decision protocol** — classify → check lessons → match skill → assess complexity

We'll adapt this structure for the Poker Assistant's specific needs.

## Phase 1: Core CLAUDE.md Rewrite

### Task 1.1: Rewrite CLAUDE.md

Complete rewrite reflecting the new project direction. Key sections:
- Project overview (Poker Assistant, not game engine)
- Updated tech stack (add React Native/Expo, Claude API, remove web frontend)
- Development commands (updated for new workspace structure)
- Architecture description matching [[poker-assistant/02-architecture]]
- Decision protocol (adapted from PlaySmith)
- Skill and agent routing tables
- Quality gates
- Commit strategy

## Phase 2: Rules Files

Rules are auto-loaded context that enforce conventions without explicit invocation.

### Task 2.1: Core rules

| Rule File | Purpose | Source |
|-----------|---------|--------|
| `coding-conventions.md` | Existing conventions file — review and update | Existing |
| `naming.md` | Naming conventions | Adapt from PlaySmith (already shared globally) |
| `testing.md` | Test patterns for Bun, poker engine, API | Adapt from PlaySmith |
| `services.md` | Service layer patterns for poker services | Adapt from PlaySmith |
| `types.md` | Type conventions, shared package rules | Adapt from PlaySmith |
| `api-layer.md` | API route conventions, Elysia patterns | Adapt from PlaySmith |

### Task 2.2: Domain-specific rules

| Rule File | Purpose |
|-----------|---------|
| `poker-domain.md` | Poker-specific conventions: card notation (`'T'` not `'10'`), position system, hand representation, GTO data formats |
| `llm-integration.md` | Claude API conventions: prompt structure, tool use patterns, parse/interpret separation, hallucination prevention ([[poker-assistant/04-llm-rag-layer]]) |
| `mobile.md` | React Native/Expo conventions: component patterns, navigation, state management, platform-specific code |

### Task 2.3: Workflow rules

| Rule File | Purpose |
|-----------|---------|
| `skill-routing.md` | Map task types to skills (adapted from PlaySmith) |
| `subagent-routing.md` | Map needs to specialized agents |
| `doc-triggers.md` | When code changes, which docs need updating |
| `obsidian-conventions.md` | Wiki-links, frontmatter schema, vault integration |

## Phase 3: Custom Commands (Skills)

Commands invoked via `/command-name`.

### Task 3.1: Planning & execution commands

| Command | Purpose | Reference |
|---------|---------|-----------|
| `/write-plan` | Convert design into implementation plan with TDD steps | PlaySmith's `write-plan.md` |
| `/execute-plan` | Execute plan in batches of 3 with checkpoints | PlaySmith's `execute-plan.md` |
| `/brainstorm` | Explore design options before committing to implementation | PlaySmith's `brainstorm.md` |

### Task 3.2: Development commands

| Command | Purpose | Reference |
|---------|---------|-----------|
| `/tdd` | TDD workflow: test → fail → implement → pass → commit | PlaySmith's `tdd.md` |
| `/debug` | Structured debugging workflow | PlaySmith's `debug.md` |
| `/verify` | Run all quality gates before declaring "done" | PlaySmith's `verify.md` |
| `/commit` | Standardized commit workflow | PlaySmith's `commit.md` |

### Task 3.3: Domain-specific commands

| Command | Purpose |
|---------|---------|
| `/test-poker-scenario` | Test a poker scenario against the GTO engine — validate parsing, lookup, and interpretation |
| `/review-prompt` | Review and iterate on Claude API prompts for parsing and interpretation |
| `/research-codebase` | Deep codebase exploration (adapted from PlaySmith) |

### Task 3.4: Session management commands

| Command | Purpose | Reference |
|---------|---------|-----------|
| `/session-summary` | Capture session to vault | Global (already exists) |
| `/intelligent-compact` | Pause/resume session context | PlaySmith's `intelligent-compact.md` |
| `/context-audit` | Verify what context is loaded | PlaySmith's `context-audit.md` |

## Phase 4: Specialized Agents

Subagent definitions for parallel and specialized work.

### Task 4.1: Development agents

| Agent | Purpose |
|-------|---------|
| `test-generator.md` | Generate tests for poker services and API endpoints |
| `test-fixer.md` | Diagnose and fix failing tests |
| `codebase-analyzer.md` | Analyze code patterns and architecture |
| `file-reviewer.md` | Review individual files for quality |

### Task 4.2: Domain agents

| Agent | Purpose |
|-------|---------|
| `poker-engine-agent.md` | Specialist for hand evaluation, betting logic, position systems |
| `llm-prompt-agent.md` | Specialist for Claude API prompt engineering, tool definitions, response formatting |
| `gto-data-agent.md` | Specialist for GTO solution data, precomputed ranges, solver output interpretation |

## Phase 5: Project Configuration

### Task 5.1: Claude Code settings

- `.claude/settings.json` — tool permissions, auto-approve patterns
- `.claude/settings.local.json` — local overrides

### Task 5.2: Lessons infrastructure

- Create `tasks/lessons.md` — self-improvement loop (from PlaySmith pattern)
- Active lessons table with date, area, lesson, source
- Graduation process: after 3+ repeats, move to rules file

### Task 5.3: Memory setup

- Review and update auto-memory at `/Users/jackhuffman/.claude-personal/projects/-Users-jackhuffman-mako-poker/memory/`
- Capture key architectural decisions from [[poker-assistant/00-index]]
- Link to planning docs

## Success Criteria

- `.claude/` directory has rules, commands, and agents tailored to Poker Assistant development
- `CLAUDE.md` accurately describes the current project state and workflow
- `/write-plan` and `/execute-plan` commands work for creating and running implementation plans
- `/tdd`, `/debug`, and `/verify` commands available for development workflow
- Skill routing table covers all common task types
- Domain-specific rules capture poker conventions, LLM patterns, and mobile patterns
- Self-improvement loop (lessons.md) is initialized

## Dependencies

- **Depends on**: [[01-repo-cleanup]] (needs clean codebase to write accurate CLAUDE.md)
- **Blocks**: [[03-mvp-implementation]] (infrastructure should be in place before building features)
