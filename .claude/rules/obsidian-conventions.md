---
paths: 'docs/**'
---

# Obsidian Vault Conventions

The unified vault lives at `~/vault/`. Project docs are symlinked at `~/vault/projects/mako-poker/` -> `~/mako-poker/docs/`.

## Frontmatter Required

All docs in `docs/` MUST have YAML frontmatter:

```yaml
---
title: "Document Title"
type: plan | guide | research | decision | progress | session
status: draft | active | archived | deprecated
area: projects
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [relevant, tags]
related: [other-doc-references]
---
```

## Markdown Links

- **Project docs in `docs/`**: Standard markdown `[text](path)` — renders on GitHub
- **Vault-native content** (sessions, thinking, daily): Wiki-links `[[note]]`
- **External URLs**: Always standard markdown `[text](url)`

## Cross-Project Search

Use `/vault-search` to find context across all projects, sessions, and thinking notes.

## Doc Structure

```
docs/
  plans/        — Implementation plans
  guides/       — Reference guides (context engineering, style guide)
  research/     — Research documents
  progress/     — Session compaction files
  sessions/     — Session breakdowns
  poker-assistant/  — Design documents
```
