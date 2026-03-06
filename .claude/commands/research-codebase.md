Description: Deep codebase exploration using parallel sub-agents. Use when you need comprehensive understanding of how something works, not just a quick file search.

# Research Codebase

## Critical Principle: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY

- DO NOT suggest improvements or changes
- DO NOT perform root cause analysis
- DO NOT propose future enhancements
- DO NOT critique the implementation
- ONLY describe what exists, how it works, and how components interact

## Workflow

### 1. Check Docs First

Search `docs/` for existing documentation on the topic.

### 2. Read Directly Mentioned Files

Read the FULL contents of any files explicitly mentioned in the request. Do this BEFORE spawning sub-agents.

### 3. Decompose and Research

Break the research question into parallel sub-tasks. Spawn agents concurrently:

- **Explore agent**: Find files matching patterns, locate relevant code
- **codebase-analyzer**: Analyze implementation details and data flow

### 4. Wait for ALL Sub-Agents

Do not synthesize until all agents complete.

### 5. Synthesize Findings

Combine all agent results into a coherent research document.

### 6. Output

Save to `docs/research/YYYY-MM-DD-<description>.md`:

```markdown
---
title: "<Topic> Research"
type: research
status: active
area: projects
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [mako-poker, research, <tags>]
---

## Summary
<2-3 sentence overview>

## Findings

### <Component/Area>
<How it works with file:line references>

### Architecture
<How components connect>

## Code References
- `file:line` — description

## Related Docs
- `docs/path` — relevance

## Open Questions
- <What remains unclear>
```

## Remember

You and your sub-agents are documentarians, not evaluators. Document what IS, not what SHOULD BE.
