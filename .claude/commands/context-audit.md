Description: Audit a file against the context engineering guide for quality and compliance. Use when creating or modifying .claude/ files, rules, commands, or documentation.

# Context Audit

Read `docs/guides/context-engineering.md` first. Then audit the provided file(s) against context engineering principles.

## Audit Checklist

### Always-Loaded Files (CLAUDE.md, rules)
- [ ] Under 200 lines
- [ ] Build/test/lint commands included (CLAUDE.md only)
- [ ] Project-specific conventions only
- [ ] No file-by-file codebase descriptions
- [ ] No frequently changing information
- [ ] IMPORTANT emphasis on critical rules
- [ ] Clear header hierarchy

### On-Demand Files (commands, agents)
- [ ] Under 500 lines
- [ ] Description field: third person, what AND when
- [ ] Default behavior with escape hatch
- [ ] Every token justified

### Reference Docs (guides, research)
- [ ] Under 800 lines
- [ ] Tables for routing, lists for rules, prose for reasoning
- [ ] Critical info at beginning
- [ ] Examples over exhaustive rules (3-5 max)

### Universal
- [ ] One domain per file
- [ ] No duplication with other files
- [ ] Path-scoped where applicable
- [ ] No PlaySmith-specific patterns remaining
- [ ] Consistent terminology

## Output

Present findings as:

```
## Context Audit: <filename>

### PASS
- <What's good>

### VIOLATIONS
- <Specific violation with line reference>
- <Suggested fix>

### Status: PASS / NEEDS FIXES
```
