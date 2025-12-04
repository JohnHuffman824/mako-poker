# Coding Conventions

These conventions must be followed for all code written in this repository.

## Core Principles

### KISS (Keep It Simple, Stupid) - HIGHEST PRIORITY
- Simple, understandable code
- No over-engineering or premature optimization
- Eliminate unnecessary indirection
- Limit nested conditionals
- **KISS is king**: Prioritize simplicity over other principles when they conflict

### DRY (Don't Repeat Yourself)
- No repeated logic
- No duplicate validation rules
- No similar code that differs only slightly

### YAGNI (You Aren't Gonna Need It)
- No unnecessary features
- Remove all commented code
- Remove all AI iteration artifacts

### Fail Fast
- Early validation
- Errors caught at source
- No silent exception catching

### Side Effects
- Methods don't alter original object state unexpectedly
- Prefer pure functions

## SOLID Principles

### Single Responsibility
- Each class/method has one reason to change

### Open/Closed
- Open for extension, closed for modification

### Liskov Substitution
- Derived classes must be substitutable for base classes

### Interface Segregation
- No client should depend on methods it doesn't use

### Dependency Inversion
- Depend on abstractions, not concretions

## Architecture & Design

### Separation of Concerns
- **Frontend**: Separate UI / business logic / data
- **Backend**: Separate controller / service / DAO layers

### Data Structures
- No parallel collections (use data classes instead of separate related lists)

### Method Design
- Pass data not objects: When consuming code only needs specific data (not behavior), pass the data directly
- No pure delegation methods (call delegate directly)

### Code Cleanup
- Remove old/deprecated code completely
- No backwards compatibility fallbacks for unsupported features

## Validation & Error Handling

### Validation Strategy
- Frontend validation for UX
- Backend validation for security
- **Server-side is source of truth**

### Exception Handling
- Catch specific exceptions not broad `Exception`
- Log exceptions using: `logger.debug(e) { "description" }` pattern
- No `System.out.println()` or `e.printStackTrace()`
- No `console.log()` in production code

## Code Style & Formatting

### Method Length
- Methods must fit on one page (max 30-45 lines)

### Line Length
- Maximum 80 characters per line

### Indentation
- Use tabs not spaces

### Readability
- No double negatives in conditionals

## JavaScript/TypeScript Conventions

### Syntax & Operators
- **No semicolons** at end of lines (except when required for ASI)
- Use `==` and `!=` for comparisons (not `===` or `!==`)
- Use optional chaining `?.` instead of patterns like `foo && foo.bar`
- Use nullish coalescing `??` instead of logical OR `||` for default values

## Naming Conventions

### File & Class Names
- File/class names must match
- JS, CSS files use same base name

### Terminology
- Consistent terminology (don't use multiple names for same concept)

### Descriptive Names
- Descriptive, intent-revealing names
- Methods describe WHAT not HOW they're implemented

### Specific Patterns
- Event handlers use "on" prefix (only handlers)
- Class names are nouns not verbs
- No `$` prefix on variables

### Avoid Generic Terms
- No "helper", "data", "bean" in names

### Type Information
- No type info in names (e.g., `datasets` not `datasetsMap`)

## Performance & Efficiency

### Database Queries
- No database calls inside loops (avoid O(n) query patterns)

### Server Requests
- Limit to one server request per user interaction

## Testing

### Test Coverage
- Unit tests required for new functionality
- Update existing affected tests when modifying code

### Test Focus
- Tests verify business logic not language/framework features
- No tests for trivial operations (constructors, getters/setters)
- Short, focused test methods (not one large method)

### TDD for Bug Fixes
- Write failing test first
- Then implement fix

### Test Implementation
- Use actual database operations (not mocks)
- Avoid mocks or spies in JavaScript tests (prefer real implementations)

## Documentation & Comments

### Commit Messages
- Include issue numbers: `Issue #63121 - description` or `fixes #63121 - description`

### Method Comments
- Explain WHY not just WHAT
- No unnecessarily long or redundant comments

### Code Maintenance
- Preserve/update existing comments when modifying code
- Cross-references between duplicate client/server implementations
- Inline comments for complex logic only

## Cleanup Requirements

### Before Submitting Code
- Remove all commented code
- Remove all AI iteration artifacts
- Remove all console.log statements (unless intentional logging)
- Remove all TODO comments (create issues instead)
- Remove all unused imports
- Remove all unused variables

## Priorities When Conventions Conflict

1. **KISS** - Simplicity is the highest priority
2. **DRY** - Don't repeat yourself
3. **YAGNI** - Don't add unnecessary features
4. **SOLID** - Follow SOLID principles
5. **Other conventions** - Apply as appropriate

When in doubt, choose the simpler solution.
