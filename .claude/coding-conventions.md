# Coding Conventions

Project-specific conventions only. Standard engineering principles (SOLID, DRY, etc.) are assumed.

## Priority Order

1. **KISS** — simplicity is the highest priority, overrides other principles when they conflict
2. **DRY** — don't repeat yourself
3. **YAGNI** — don't add unnecessary features

When in doubt, choose the simpler solution.

## TypeScript Style

- Single quotes, no semicolons (except when required for ASI)
- Use `==` and `!=` (not `===` or `!==`)
- Use `??` (not `||`) for default values
- Use optional chaining `?.` instead of `foo && foo.bar`
- Tabs not spaces
- Max 80 characters per line
- Methods max 30-45 lines

## File Naming

- kebab-case for service files (`auth-service.ts`, `gto-query-service.ts`)
- PascalCase for React Native components
- File names must match primary export

## Naming Rules

- Descriptive, intent-revealing names — WHAT not HOW
- Consistent terminology (one name per concept)
- No generic terms: "helper", "data", "bean"
- No type info in names (`datasets` not `datasetsMap`)
- Event handlers use "on" prefix (only handlers)
- Class names are nouns not verbs

## Architecture

- Pass data not objects when consuming code only needs data
- No pure delegation methods (call delegate directly)
- No database calls inside loops (O(n) query patterns)
- No `console.log()` in production code
- Catch specific errors, not broad `Error`

## React Native (when applicable)

- Use `StyleSheet.create()` for all styles
- No inline style objects (performance penalty on re-renders)
- Platform-specific code via `Platform.OS` or `.ios.ts`/`.android.ts`

## Cleanup Before Submitting

- Remove all commented code
- Remove all AI iteration artifacts
- Remove all console.log statements (unless intentional logging)
- Remove all TODO comments (create issues instead)
- Remove all unused imports and variables
