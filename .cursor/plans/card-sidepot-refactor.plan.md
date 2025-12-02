# Card Model, Hand Evaluation & Side Pot Refactor

## Overview

This plan covers three major architectural improvements:

1. **Card Model Refactor** - Replace string-based card representation with type-safe enums
2. **Hand Evaluation Enhancement** - Standardize ranking to 1-7462 scale with separate winner determination
3. **Side Pot Implementation** - Full multi-pot support for all-in scenarios

---

## Phase 1: Backend Card Model Refactor

### 1.1 Create Enum Definitions

**File:** `backend/src/main/kotlin/com/mako/model/CardEnums.kt`

```kotlin
package com.mako.model

/**
 * Playing card ranks from lowest (TWO=2) to highest (ACE=14).
 * Numeric value used for hand evaluation and comparisons.
 */
enum class Rank(val value: Int, val symbol: String) {
    TWO(2, "2"),
    THREE(3, "3"),
    FOUR(4, "4"),
    FIVE(5, "5"),
    SIX(6, "6"),
    SEVEN(7, "7"),
    EIGHT(8, "8"),
    NINE(9, "9"),
    TEN(10, "T"),
    JACK(11, "J"),
    QUEEN(12, "Q"),
    KING(13, "K"),
    ACE(14, "A");

    companion object {
        private val bySymbol = entries.associateBy { it.symbol }
        private val byValue = entries.associateBy { it.value }
        
        fun fromSymbol(symbol: String): Rank = 
            bySymbol[symbol.uppercase()] 
                ?: throw IllegalArgumentException("Invalid rank: $symbol")
        
        fun fromValue(value: Int): Rank = 
            byValue[value] 
                ?: throw IllegalArgumentException("Invalid rank value: $value")
    }
}

/**
 * Playing card suits.
 * Suits have equal value in standard poker (no suit ranking).
 */
enum class Suit(val symbol: String, val displayName: String) {
    SPADES("s", "spades"),
    HEARTS("h", "hearts"),  
    DIAMONDS("d", "diamonds"),
    CLUBS("c", "clubs");

    companion object {
        private val bySymbol = entries.associateBy { it.symbol }
        private val byDisplayName = entries.associateBy { it.displayName }
        
        fun fromSymbol(symbol: String): Suit {
            val lower = symbol.lowercase()
            return bySymbol[lower] 
                ?: byDisplayName[lower]
                ?: fromUnicode(symbol)
                ?: throw IllegalArgumentException("Invalid suit: $symbol")
        }
        
        private fun fromUnicode(symbol: String): Suit? = when(symbol) {
            "♠" -> SPADES
            "♥" -> HEARTS
            "♦" -> DIAMONDS
            "♣" -> CLUBS
            else -> null
        }
    }
}
```

### 1.2 Update Card Model

**File:** `backend/src/main/kotlin/com/mako/model/Card.kt`

```kotlin
package com.mako.model

import com.mako.dto.CardDto

/**
 * Represents a playing card with type-safe rank and suit.
 */
data class Card(
    val rank: Rank,
    val suit: Suit
) {
    /**
     * Short notation (e.g., "As" for Ace of Spades).
     */
    val notation: String get() = "${rank.symbol}${suit.symbol}"
    
    /**
     * Converts to DTO for API response.
     */
    fun toDto(): CardDto = CardDto(
        rank = rank.symbol,
        suit = suit.displayName,
        display = notation
    )

    override fun toString(): String = notation
    
    companion object {
        /**
         * Creates card from notation string (e.g., "As", "Th").
         */
        fun fromNotation(notation: String): Card {
            require(notation.length == 2) { 
                "Card notation must be 2 characters: $notation" 
            }
            return Card(
                rank = Rank.fromSymbol(notation[0].toString()),
                suit = Suit.fromSymbol(notation[1].toString())
            )
        }
    }
}
```

### 1.3 Update GameConstants for Deck Creation

**File:** `backend/src/main/kotlin/com/mako/service/GameConstants.kt` (additions)

```kotlin
// Replace string-based RANKS and SUITS with:
val ALL_RANKS: List<Rank> = Rank.entries
val ALL_SUITS: List<Suit> = Suit.entries

/**
 * Creates a standard 52-card deck.
 */
fun createStandardDeck(): MutableList<Card> {
    val deck = mutableListOf<Card>()
    for (suit in ALL_SUITS) {
        for (rank in ALL_RANKS) {
            deck.add(Card(rank, suit))
        }
    }
    return deck
}
```

---

## Phase 2: Hand Evaluation Enhancement

### 2.1 Hand Ranking System

The file `5CardSingleDeckHands.txt` shows 7,462 unique 5-card hand rankings where:

- Rank 1 = Worst (7-5-4-3-2 high card)
- Rank 7462 = Best (Royal Flush - not explicitly listed but implied as top straight flush)

**Note:** The lookup table doesn't differentiate suits for non-flush hands, which is correct since suits don't matter except for flush detection.

### 2.2 Create Hand Ranking Constants

**File:** `backend/src/main/kotlin/com/mako/service/HandRankings.kt`

```kotlin
package com.mako.service

/**
 * Hand type categories with their rank ranges.
 * Higher rank = better hand.
 */
enum class HandType(val minRank: Int, val maxRank: Int, val displayName: String) {
    HIGH_CARD(1, 1277, "High Card"),
    ONE_PAIR(1278, 4137, "Pair"),
    TWO_PAIR(4138, 4995, "Two Pair"),
    THREE_OF_A_KIND(4996, 5853, "Three of a Kind"),
    STRAIGHT(5854, 5863, "Straight"),
    FLUSH(5864, 7140, "Flush"),
    FULL_HOUSE(7141, 7296, "Full House"),
    FOUR_OF_A_KIND(7297, 7452, "Four of a Kind"),
    STRAIGHT_FLUSH(7453, 7462, "Straight Flush");
    
    companion object {
        fun fromRank(rank: Int): HandType = 
            entries.first { rank in it.minRank..it.maxRank }
    }
}
```

### 2.3 Update HandEvaluator

**File:** `backend/src/main/kotlin/com/mako/service/HandEvaluator.kt`

Key changes:

- Return standardized rank (1-7462) instead of category rank (1-9)
- Accept `Card` objects with enum-based rank/suit
- Keep the combination generation but improve ranking precision
```kotlin
/**
 * Result of hand evaluation with standardized ranking.
 * 
 * @property absoluteRank Ranking from 1-7462 (higher = better)
 * @property handType The category of hand (pair, flush, etc.)
 * @property description Human-readable description
 */
data class HandResult(
    val absoluteRank: Int,
    val handType: HandType,
    val description: String
) : Comparable<HandResult> {
    override fun compareTo(other: HandResult): Int = 
        absoluteRank.compareTo(other.absoluteRank)
}
```


### 2.4 Create Winner Determination Service

**File:** `backend/src/main/kotlin/com/mako/service/ShowdownService.kt`

```kotlin
package com.mako.service

import com.mako.model.Card
import com.mako.model.Player
import org.springframework.stereotype.Service

/**
 * Result of a showdown for a single pot.
 */
data class PotWinner(
    val pot: SidePot,
    val winners: List<Player>,
    val handResult: HandResult,
    val amountPerWinner: Double
)

/**
 * Handles showdown logic and winner determination.
 * Separates hand evaluation from pot distribution.
 */
@Service
class ShowdownService(
    private val handEvaluator: HandEvaluator
) {
    /**
     * Determines winners for all pots at showdown.
     * 
     * @param players All players who reached showdown (not folded)
     * @param communityCards The 5 community cards
     * @param pots All pots (main + side pots)
     * @return List of pot winners with amounts
     */
    fun determineWinners(
        players: List<Player>,
        communityCards: List<Card>,
        pots: List<SidePot>
    ): List<PotWinner> {
        // Evaluate each player's hand once
        val playerHands = players.associate { player ->
            player to handEvaluator.evaluate(player.holeCards, communityCards)
        }
        
        // Determine winners for each pot
        return pots.map { pot ->
            determinePotwinner(pot, playerHands)
        }
    }
    
    private fun determinePotWinner(
        pot: SidePot,
        playerHands: Map<Player, HandResult>
    ): PotWinner {
        // Only eligible players can win this pot
        val eligibleHands = playerHands.filterKeys { it in pot.eligiblePlayers }
        
        val bestRank = eligibleHands.values.maxOf { it.absoluteRank }
        val winners = eligibleHands.filter { it.value.absoluteRank == bestRank }.keys.toList()
        val bestHand = eligibleHands[winners.first()]!!
        
        return PotWinner(
            pot = pot,
            winners = winners,
            handResult = bestHand,
            amountPerWinner = pot.amount / winners.size
        )
    }
}
```

---

## Phase 3: Side Pot Implementation

### 3.1 Side Pot Data Model

**File:** `backend/src/main/kotlin/com/mako/model/SidePot.kt`

```kotlin
package com.mako.model

/**
 * Represents a pot (main or side) with its eligible players.
 * 
 * Side pots are created when a player goes all-in and other players
 * continue betting. Each pot tracks:
 * - The amount in the pot
 * - Which players are eligible to win it
 * - The maximum contribution per player for this pot level
 */
data class SidePot(
    val id: Int,
    var amount: Double,
    val eligiblePlayers: MutableSet<Player>,
    val capPerPlayer: Double  // Max each player can contribute to THIS pot
) {
    val isMainPot: Boolean get() = id == 0
}
```

### 3.2 Pot Manager Service

**File:** `backend/src/main/kotlin/com/mako/service/PotManager.kt`

```kotlin
package com.mako.service

import com.mako.model.Player
import com.mako.model.SidePot
import org.springframework.stereotype.Service
import kotlin.math.min

/**
 * Manages pot creation and distribution for all-in scenarios.
 * 
 * Side pot creation rules:
 * 1. Main pot: All players contribute up to smallest all-in amount
 * 2. Side pot 1: Players with more than smallest all-in contribute up to next all-in
 * 3. Continue for each all-in amount level
 * 
 * Example: Players A(100), B(50 all-in), C(200)
 * - Main pot: 50*3 = 150 (A, B, C eligible)
 * - Side pot: 50*2 = 100 (A, C eligible - B can't win this)
 */
@Service
class PotManager {

    /**
     * Calculates and creates all pots based on player contributions.
     * Call this at showdown to determine pot distribution.
     * 
     * @param contributions Map of player to their total contribution this hand
     * @param activePlayers Players still in the hand (not folded)
     * @return List of pots from main pot to final side pot
     */
    fun calculatePots(
        contributions: Map<Player, Double>,
        activePlayers: Set<Player>
    ): List<SidePot> {
        // Filter to only active players' contributions
        val activeContributions = contributions.filterKeys { it in activePlayers }
        
        if (activeContributions.isEmpty()) {
            return emptyList()
        }
        
        // Get unique contribution levels (all-in amounts create new pot boundaries)
        val allInAmounts = activeContributions.values
            .filter { it > 0 }
            .distinct()
            .sorted()
        
        if (allInAmounts.isEmpty()) {
            return emptyList()
        }
        
        val pots = mutableListOf<SidePot>()
        var previousCap = 0.0
        var potId = 0
        
        for (cap in allInAmounts) {
            val contributionAtThisLevel = cap - previousCap
            
            // Find players who contributed at least this much
            val eligiblePlayers = activeContributions
                .filter { it.value >= cap }
                .keys
                .toMutableSet()
            
            // Also include players who went all-in at this exact level
            activeContributions
                .filter { it.value == cap }
                .keys
                .forEach { eligiblePlayers.add(it) }
            
            if (eligiblePlayers.isNotEmpty()) {
                // Count how many players contributed to this pot level
                val contributorsAtLevel = activeContributions
                    .filter { it.value >= previousCap }
                    .count()
                
                val potAmount = contributionAtThisLevel * contributorsAtLevel
                
                if (potAmount > 0) {
                    pots.add(SidePot(
                        id = potId++,
                        amount = potAmount,
                        eligiblePlayers = eligiblePlayers,
                        capPerPlayer = cap
                    ))
                }
            }
            
            previousCap = cap
        }
        
        return pots
    }
    
    /**
     * Distributes winnings from all pots to winners.
     * 
     * @param potWinners Results from ShowdownService
     */
    fun distributeWinnings(potWinners: List<PotWinner>) {
        for (result in potWinners) {
            for (winner in result.winners) {
                winner.stack += result.amountPerWinner
            }
        }
    }
}
```

### 3.3 Update GameState

**File:** `backend/src/main/kotlin/com/mako/service/GameService.kt`

Add to `GameState`:

```kotlin
data class GameState(
    // ... existing fields ...
    var pot: Double,  // Keep for backward compat / quick display
    val playerContributions: MutableMap<Int, Double> = mutableMapOf(),  // seatIndex -> total contributed
    var sidePots: List<SidePot> = emptyList()  // Calculated at showdown
)
```

### 3.4 Update BettingRoundManager

Track contributions on each bet/call/raise:

```kotlin
private fun recordContribution(game: GameState, player: Player, amount: Double) {
    val current = game.playerContributions[player.seatIndex] ?: 0.0
    game.playerContributions[player.seatIndex] = current + amount
}
```

---

## Phase 4: Frontend Updates

### 4.1 Update API Types

**File:** `frontend/src/api/client.ts`

```typescript
// Card uses semantic types matching backend
interface CardDto {
  rank: Rank    // 'A' | '2' | ... | 'K'
  suit: Suit    // 'spades' | 'hearts' | 'diamonds' | 'clubs'  
  display: string  // "As", "Th", etc.
}

// Side pot information for display
interface SidePotDto {
  id: number
  amount: number
  eligiblePlayerSeats: number[]
}

// Add to GameStateResponse
interface GameStateResponse {
  // ... existing fields ...
  sidePots: SidePotDto[]
  playerContributions: Record<number, number>  // seatIndex -> amount
}
```

### 4.2 Update Card Components

The frontend already uses `Suit` and `Rank` types. Update `parseSuit` and `parseRank` to handle the new backend format (which will use "spades", "hearts" etc. instead of symbols).

---

## Phase 5: Test Coverage

### 5.1 Card Enum Tests

**File:** `backend/src/test/kotlin/com/mako/model/CardEnumsTest.kt`

- Test `Rank.fromSymbol` for all valid symbols
- Test `Rank.fromValue` for all valid values  
- Test `Suit.fromSymbol` for single-char, display name, and unicode
- Test invalid input throws appropriate exceptions

### 5.2 Hand Evaluator Tests (Enhanced)

**File:** `backend/src/test/kotlin/com/mako/service/HandEvaluatorTest.kt`

Update existing tests to:

- Verify `absoluteRank` is in correct range for each hand type
- Test hand comparisons using absolute rank
- Verify ranking matches expected order from lookup table

### 5.3 Side Pot Tests

**File:** `backend/src/test/kotlin/com/mako/service/PotManagerTest.kt`

Test scenarios:

1. **No all-ins:** Single main pot
2. **One all-in:** Main pot + one side pot
3. **Multiple all-ins at different levels:** Main + multiple side pots
4. **All-in for less than blind:** Special handling
5. **Multiple players same all-in amount:** Single pot level
6. **Folded players:** Not eligible for any pot

### 5.4 Showdown Tests  

**File:** `backend/src/test/kotlin/com/mako/service/ShowdownServiceTest.kt`

Test scenarios:

1. **Single winner:** Gets full pot
2. **Split pot (tie):** Equal distribution
3. **Side pot winner different from main:** Correct pot assignment
4. **All-in player wins main but not side:** Proper eligibility

### 5.5 Integration Tests

**File:** `backend/src/test/kotlin/com/mako/service/GameServiceIntegrationTest.kt`

Full hand scenarios:

1. Hand with all-in and side pot
2. Multiple all-ins, 3+ side pots
3. Showdown with ties in different pots

---

## Implementation Order

1. **Phase 1.1-1.3:** Card enums (no breaking changes yet)
2. **Phase 1 Tests:** Card enum tests
3. **Phase 2.1-2.3:** Hand evaluation updates
4. **Phase 2 Tests:** Hand evaluator tests
5. **Phase 3.1-3.4:** Side pot implementation
6. **Phase 3 Tests:** Pot manager and showdown tests
7. **Phase 4:** Frontend updates
8. **Phase 5:** Integration tests

---

## Migration Notes

### API Compatibility

- `CardDto` maintains same structure (rank: string, suit: string)
- Backend converts enums to strings in DTOs
- Frontend parsers already handle the new format ("spades" vs "♠")

### Database

- No database changes needed (in-memory game state)

### Breaking Changes

- None for API consumers
- Internal code uses enums instead of strings

---

## Files to Create/Modify

### New Files

- `backend/src/main/kotlin/com/mako/model/CardEnums.kt`
- `backend/src/main/kotlin/com/mako/model/SidePot.kt`
- `backend/src/main/kotlin/com/mako/service/HandRankings.kt`
- `backend/src/main/kotlin/com/mako/service/PotManager.kt`
- `backend/src/main/kotlin/com/mako/service/ShowdownService.kt`
- `backend/src/test/kotlin/com/mako/model/CardEnumsTest.kt`
- `backend/src/test/kotlin/com/mako/service/PotManagerTest.kt`
- `backend/src/test/kotlin/com/mako/service/ShowdownServiceTest.kt`

### Modified Files

- `backend/src/main/kotlin/com/mako/model/Card.kt`
- `backend/src/main/kotlin/com/mako/service/GameConstants.kt`
- `backend/src/main/kotlin/com/mako/service/GameService.kt`
- `backend/src/main/kotlin/com/mako/service/HandEvaluator.kt`
- `backend/src/main/kotlin/com/mako/service/BettingRoundManager.kt`
- `backend/src/test/kotlin/com/mako/service/HandEvaluatorTest.kt`