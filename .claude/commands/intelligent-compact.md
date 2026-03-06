Description: Compact current session into a resumable progress file for later continuation. Use when pausing work mid-task or when context is getting long and needs to be preserved.

# Intelligent Compact

## Core Principle: Minimum viable context for maximum resumption velocity.

## Iron Laws

- EXACT REFERENCES — file paths with line numbers, not vague descriptions
- STATE OVER STORY — what IS, not what HAPPENED
- ERRORS PRESERVED — exact error messages verbatim
- ACTIONABLE NEXT STEPS — specific enough to resume without re-reading conversation

## Workflow

### 1. Audit Session

Review conversation for:
- Current objective and progress
- Files modified (with paths)
- What's working vs broken
- Key decisions made
- Blockers or open questions

### 2. Synthesize (Ruthless Filtering)

Include ONLY what's needed to resume. No pleasantries, no narrative, no recap of the journey.

### 3. Write Progress File

Filename: `YYYY-MM-DD-HH-MM-<topic>.md`

```markdown
---
title: "<Topic> Progress"
type: progress
status: active
area: projects
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [mako-poker, progress, <tags>]
---

## Objective
<One sentence>

## Current State

### Working
- <What's functioning with file references>

### Broken
- <What's failing with exact error messages>

### Pending
- <What hasn't been started>

## Modified Files

| File | Status | Notes |
|------|--------|-------|
| `path/to/file:line` | done/partial/broken | <brief note> |

## Key Decisions
- <Decision>: <rationale>

## Next Steps
1. <Exact action with file path>
2. <Exact action with file path>

## Context for Resumption
<Anything non-obvious needed to continue — env setup, running processes, etc.>
```

### 4. Save

Write to `docs/progress/YYYY-MM-DD-HH-MM-<topic>.md`

### 5. Resumption Instructions

Tell the user: "To resume, start a new session and say: 'Resume from docs/progress/<filename>.md'"
