# Backend Test Suite

## Overview

Comprehensive JUnit 5 test suite for Mako Poker backend game logic.
Tests are written to define **expected behavior**, not to match current implementation.
Failing tests indicate production code needs fixes.

## Running Tests

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests HandEvaluatorTest
./gradlew test --tests GameServiceTest
./gradlew test --tests ActionOrderManagerTest
./gradlew test --tests BettingRoundManagerTest

# Run with detailed output
./gradlew test --info

# View HTML report
open build/reports/tests/test/index.html
```

## Test Structure

```
test/kotlin/com/mako/
├── TestConfig.kt                    # Shared test utilities
├── service/
│   ├── HandEvaluatorTest.kt        # 29 tests - Hand ranking logic
│   ├── GameServiceTest.kt          # 29 tests - Core game mechanics  
│   ├── ActionOrderManagerTest.kt   # 18 tests - Turn order management
│   └── BettingRoundManagerTest.kt  # 18 tests - Betting round logic
└── model/
    └── PlayerTest.kt               # Future: Player model tests
```

## Test Coverage

### HandEvaluatorTest (29 tests)
- Hand type recognition (9): High Card through Straight Flush
- Straight edge cases (4): Wheel, Broadway, invalid straights
- Kicker comparisons (8): Same hand type, different kickers
- 7-card combinations (5): Best hand selection scenarios
- Card count handling (3): 5, 6, and 7 card scenarios

### GameServiceTest (29 tests)
- Button movement (4): Clockwise, skipping empty, wrapping, non-consecutive
- Dead button rule (5): SB/Button elimination, player joining, heads-up
- Blind posting (6): SB/BB positions, short stacks, pot calculation
- Position assignment (4): 2, 3, 6, 10 player configurations
- Player management (8): Add/remove players, validation
- Core game flow (2): Starting state, card dealing

### ActionOrderManagerTest (18 tests)
- Action order building (5): Full ring, heads-up, gaps, reordering
- First to act (4): Preflop/post-flop, full ring/heads-up
- Available actions (6): Different game states (check, call, fold, all-in)
- Seat navigation (3): Finding next occupied seat, wrap-around

### BettingRoundManagerTest (18 tests)
- Round start (4): Preflop blinds, post-flop reset, pot/raise calculations
- Action processing (8): Fold, check, call, raise, all-in variations
- Round completion (4): All checked, all called, player waiting, one left
- Edge cases (2): All-in doesn't block, heads-up preflop

## Test Philosophy

### No Mocks
Tests use actual production code without mocks or spies.
This ensures we test real behavior, not test doubles.

### Expected Behavior
Tests define how the game SHOULD work according to poker rules.
If a test fails, the production code needs to change, not the test.

### Real Scenarios
Tests use realistic game situations:
- Actual card combinations
- Real player configurations  
- Valid betting sequences
- Edge cases from actual poker play

## Helper Utilities

### TestHelpers (in TestConfig.kt)

```kotlin
import com.mako.TestHelpers.cards
import com.mako.TestHelpers.sevenCards

// Create cards from shorthand
val myCards = cards("AH KD QC")  // Ace hearts, King diamonds, Queen clubs

// Create 7-card hand (2 hole + 5 community)
val hand = sevenCards("AH KD", "QC JS TH 9D 8C")
```

### Suit Notation
- H = ♥ Hearts
- D = ♦ Diamonds  
- C = ♣ Clubs
- S = ♠ Spades

### Rank Notation
- 2-9 = Number cards
- T = Ten
- J = Jack
- Q = Queen
- K = King
- A = Ace

## Common Assertions

```kotlin
// Hand comparison
assertTrue(result1 > result2, "AA should beat KK")
assertEquals(0, result1.compareTo(result2), "Hands should tie")

// Hand type verification
assertEquals(5, result.rank, "Should be straight (rank 5)")
assertEquals("Straight", result.handName)

// Kicker verification
assertEquals(14, result.kickers[0], "First kicker should be Ace (14)")

// Position verification
assertEquals("BTN", player.position)
assertEquals(2, game.dealerSeatIndex)

// Betting verification
assertEquals(1.5, game.pot, 0.001, "Pot should be SB + BB")
```

## Debugging Failed Tests

1. **Run specific failing test:**
   ```bash
   ./gradlew test --tests "GameServiceTest.testButtonMovesClockwise"
   ```

2. **Check detailed report:**
   ```bash
   open build/reports/tests/test/index.html
   ```

3. **Add debug logging in production code:**
   ```kotlin
   println("DEBUG: dealerSeatIndex = ${game.dealerSeatIndex}")
   ```

4. **Re-run test with --info:**
   ```bash
   ./gradlew test --tests GameServiceTest --info
   ```

## Adding New Tests

1. Create test class in appropriate directory
2. Use `@Test` and `@DisplayName` annotations
3. Follow "Arrange-Act-Assert" pattern
4. Use descriptive test names
5. Test one behavior per test method

Example:
```kotlin
@Test
@DisplayName("Full house beats flush")
fun testFullHouseBeatsFlush() {
    // Arrange
    val fullHouse = sevenCards("AH AD", "AC KS KH 9D 8C")
    val flush = sevenCards("AH KH", "QH JH 9H 8D 2C")
    
    // Act
    val result1 = HandEvaluator.evaluate(fullHouse.take(2), fullHouse.drop(2))
    val result2 = HandEvaluator.evaluate(flush.take(2), flush.drop(2))
    
    // Assert
    assertTrue(result1 > result2, "Full house should beat flush")
}
```

