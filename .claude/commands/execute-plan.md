Description: Execute a pre-approved implementation plan in batches of 3 tasks with checkpoints. Use when a plan exists in docs/plans/ and the user wants to begin implementation.

# Execute Plan

Execute implementation plans exactly as written, in batches with verification.

## Iron Laws

- **Follow the plan exactly** — don't improve, optimize, or deviate mid-execution
- **Batch of 3, then checkpoint** — execute 3 tasks, report, wait for feedback
- **Stop when blocked** — don't guess or work around issues
- **Verify every step** — run the commands, check the output

## Workflow

### 1. Load Plan

Read the plan file. If no file specified, ask which plan to execute.

### 2. Review

Summarize: total tasks, estimated scope, any prerequisites.

### 3. Execute Batch (3 tasks)

For each task:
1. Read the task steps
2. Execute each step exactly as written
3. Verify the expected outcome
4. If step fails: STOP and report

### 4. Checkpoint Report

After each batch of 3:

```
## Checkpoint: Tasks X-Y Complete

- [x] Task X: <name> — passed
- [x] Task Y: <name> — passed
- [x] Task Z: <name> — passed

### Quality Gates
- Tests: X passing, 0 failing
- Types: clean

### Next Batch
Tasks A, B, C

Continue? [Y/n]
```

### 5. Stop Conditions

Stop immediately and report when:
- Test fails unexpectedly
- File referenced in plan doesn't exist
- Plan step is ambiguous or incomplete
- Same failure repeats twice
- User says stop

### 6. Completion

When all tasks done:
- Run full verification: `bun test && bun run typecheck`
- Report final status
- Suggest `/commit` for the work
