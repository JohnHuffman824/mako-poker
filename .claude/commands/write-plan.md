Description: Convert a validated design into a step-by-step implementation plan with TDD. Use after `/brainstorm` produces a design, or when the user has a clear feature to implement.

# Write Plan

Convert designs into implementation plans where every step is atomic, testable, and unambiguous.

## Iron Laws

- **One action per step** (2-5 minutes each)
- **Exact file paths** with line numbers where applicable
- **Complete code** — never "add X here" or "implement Y"
- **TDD ALWAYS** — every feature step: test -> fail -> implement -> pass -> commit

## Template

```markdown
---
title: "<Feature> Implementation Plan"
type: plan
status: draft
area: projects
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [poker, plan, <feature-tag>]
related: [<related-plans>]
---

# <Feature> Implementation Plan

## Goal
<1-2 sentences: what we're building and why>

## Architecture
<How this fits into the existing system>

## Files

### Create
- `path/to/new-file.ts` — purpose

### Modify
- `path/to/existing-file.ts` — what changes

### Test
- `test/path/to/file.spec.ts` — what's tested

## Tasks

### Task 1: <Name>

**Step 1:** Write failing test
\`\`\`typescript
// test/path/to/file.spec.ts
<complete test code>
\`\`\`

**Step 2:** Verify test fails
\`\`\`bash
bun test test/path/to/file.spec.ts
\`\`\`

**Step 3:** Implement
\`\`\`typescript
// src/path/to/file.ts
<complete implementation>
\`\`\`

**Step 4:** Verify test passes
\`\`\`bash
bun test test/path/to/file.spec.ts
\`\`\`

**Step 5:** Commit
\`\`\`bash
git add -A && git commit -m "feat: <description>"
\`\`\`
```

## Task Ordering

1. Types and interfaces
2. Database schema changes
3. Service layer (with tests)
4. API routes (with tests)
5. Integration tests
6. Documentation updates

## Output

Save to `docs/plans/YYYY-MM-DD-<feature>-implementation.md`

When complete: "Plan ready. Use `/execute-plan` to begin implementation."
