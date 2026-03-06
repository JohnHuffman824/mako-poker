Description: Capture current session as a detailed breakdown to the Obsidian vault. Use at the end of a work session or when the user wants to record progress.

# Session Summary

Save a detailed session breakdown to `~/vault/claude-sessions/`.

## Workflow

### 1. Gather Evidence

Review the conversation for:
- What was the objective?
- What was accomplished?
- What decisions were made?
- What files were changed?
- What problems were encountered and solved?
- What's left to do?

### 2. Write Breakdown

Filename: `YYYY-MM-DD-HH-MM-<kebab-case-topic>.md`

```markdown
---
title: "<Session Topic>"
type: session
status: active
area: projects/mako-poker
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [mako-poker, session, <relevant-tags>]
related: [<related-docs>]
---

# <Session Topic>

## Objective
<What we set out to do>

## Summary
<2-3 sentence overview of what happened>

## Work Completed
- <Completed item with specific details>

## Files Changed

| File | Change |
|------|--------|
| `path/to/file` | Description of change |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| <What was decided> | <Why> |

## Problems & Solutions

### <Problem>
- **Cause**: <root cause>
- **Fix**: <what was done>

## Open Threads
- <What's left to do>
- <Questions still open>

## Next Steps
1. <Concrete next action>
2. <Follow-up item>
```

### 3. Save

Write to `~/vault/claude-sessions/YYYY-MM-DD-HH-MM-<topic>.md`

### 4. Confirm

Tell the user where the file was saved and summarize key points.
