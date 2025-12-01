# Frontend Test Suite

## Overview

Vitest test suite for Mako Poker frontend utilities and state management.
Tests pure functions and state transitions without mocks.

## Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test file
npx vitest run src/test/constants/positions.spec.ts
npx vitest run src/test/store/gameStore.spec.ts
npx vitest run src/test/lib/utils.spec.ts
```

## Test Structure

```
test/
├── setup.ts                    # Vitest configuration
├── constants/
│   └── positions.spec.ts      # 19 tests - Position calculations
├── store/
│   └── gameStore.spec.ts      # 8 tests - State management
└── lib/
    └── utils.spec.ts          # 10 tests - Utility functions
```

## Test Coverage

**Total: 37 tests, all passing ✅**

### positions.spec.ts (19 tests)
Tests position calculation utilities:
- ✅ `getDealerButtonPosition()` for all 10 seats
- ✅ `getBetMarkerPosition()` for all 10 seats
- ✅ Invalid seat index handling
- ✅ Position array completeness
- ✅ Bet markers closer to center than buttons
- ✅ Position uniqueness
- ✅ TABLE_CENTER validation

### gameStore.spec.ts (8 tests)
Tests Zustand store state transitions:
- ✅ Initial state correctness
- ✅ Error state management
- ✅ `clearError()` functionality
- ✅ `setAutoDeal()` toggle
- ✅ Loading state updates
- ✅ Game state updates

**Note:** API calls are not tested here - those are integration tests.

### utils.spec.ts (10 tests)
Tests className utility function:
- ✅ Single class merging
- ✅ Multiple class merging
- ✅ Conditional classes
- ✅ Null/undefined handling
- ✅ Tailwind conflict resolution
- ✅ Array of classes
- ✅ Object with boolean values
- ✅ Empty input
- ✅ Deduplication
- ✅ Class order preservation

## Configuration

### jasmine.json
```json
{
  "spec_dir": "src/test",
  "spec_files": ["**/*.spec.ts"],
  "helpers": ["setup.ts"],
  "stopSpecOnExpectationFailure": false,
  "random": false
}
```

### setup.ts
- Configures Jasmine timeout (10 seconds for async tests)
- beforeEach/afterEach hooks for test setup/cleanup
- Custom matchers (if needed)

## Test Philosophy

### No Mocks
We test actual functions and state transitions without mocking internal behavior.

### Pure Function Focus
Frontend tests focus on:
- Utility functions (cn, position calculations)
- State management (Zustand store)
- UI calculations

API integration is tested at the backend level.

### Avoid Spies
Don't spy on internal function calls. Test observable behavior only.

## Adding New Tests

1. Create `*.spec.ts` file in appropriate directory
2. Import function/component to test
3. Use `describe` blocks for organization
4. Use `it` for individual test cases
5. Use `expect()` for assertions

Example:
```typescript
import { myFunction } from '../../lib/myFunction'

describe('myFunction', () => {
  it('returns expected value for valid input', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('handles edge case', () => {
    const result = myFunction(null)
    expect(result).toBeNull()
  })
})
```

## Common Patterns

### Testing Position Functions
```typescript
it('returns correct coordinates for seat 5', () => {
  const pos = getDealerButtonPosition(5)
  expect(pos.top).toBe(268)
  expect(pos.left).toBe(720)
})
```

### Testing Store State
```typescript
it('updates state correctly', () => {
  const store = useGameStore.getState()
  
  store.setAutoDeal(true)
  
  expect(useGameStore.getState().autoDeal).toBe(true)
})
```

### Testing Utility Functions
```typescript
it('merges classes correctly', () => {
  const result = cn('foo', 'bar')
  expect(result).toContain('foo')
  expect(result).toContain('bar')
})
```

## Debugging

### Isolate Test
```bash
npx jasmine-ts src/test/constants/positions.spec.ts
```

### Add Console Logs
```typescript
it('my test', () => {
  const result = myFunction()
  console.log('Result:', result)
  expect(result).toBe(expected)
})
```

### Check Test Output
Jasmine shows:
- Test name
- Pass/fail status
- Error messages with line numbers
- Expected vs actual values

## Dependencies

Required packages in package.json:
```json
"devDependencies": {
  "jasmine": "^5.1.0",
  "@types/jasmine": "^5.1.0",
  "jasmine-ts": "^0.4.0",
  "ts-node": "^10.9.0"
}
```

## Future Enhancements

Potential additional test coverage:
- Component rendering tests (React Testing Library)
- Hook behavior tests (useGameActions, useAiActionLoop)
- Integration tests with mocked API
- E2E tests with Playwright/Cypress

