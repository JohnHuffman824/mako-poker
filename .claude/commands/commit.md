Description: Analyze changes and create a well-structured conventional commit. Use when code changes are complete and verified, ready to be committed.

# Commit

## Workflow: INSPECT -> STAGE -> ANALYZE -> COMMIT -> VERIFY

### 1. INSPECT

```bash
git status
git diff --cached
git diff
```

Review what changed. Understand the scope.

### 2. STAGE

Add relevant files. Never stage secrets or env files.

```bash
git add <specific-files>
```

### 3. ANALYZE

Determine commit type and write message:

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that doesn't fix bug or add feature |
| `test` | Adding or fixing tests |
| `chore` | Build, config, tooling changes |

Format: `<type>: <brief summary of why>`

### 4. COMMIT

```bash
git commit -m "<type>: <summary>"
```

### 5. PUSH

```bash
git push
```

### 6. VERIFY

```bash
git status
git log --oneline -1
```

## IMPORTANT

- **No AI attribution** — no Co-Authored-By, no "Generated with Claude", no AI signatures
- No force push without explicit user approval
- No --no-verify unless user explicitly requests
- No amend on already-pushed commits
- No empty commits
- Don't stage `.env`, credentials, or secrets
