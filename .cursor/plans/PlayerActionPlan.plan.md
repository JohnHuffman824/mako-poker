Implementation Plan: Player Action Order & State Tracking System

## Executive Summary

This plan outlines a comprehensive refactoring of the poker game's turn management and action tracking system. The goal is to create a clean, maintainable architecture that:

- Orders players by betting action sequence (SB first, BTN last)

- Explicitly tracks available actions for each player

- Unifies preflop and post-flop betting logic

- Provides clear abstraction between AI and human players

---

## Phase 1: Data Model Refactoring

### 1.1 Create Player Interface Hierarchy

**File:** `backend/src/main/kotlin/com/mako/model/Player.kt` (new file)

```kotlin

package com.mako.model



import com.mako.service.Card



/**

    * Available actions for a player on their turn.

    * Determines what buttons/options the UI should show.

 */

enum class AvailableActions {

    /** Player cannot act - folded, all-in, or waiting */

    NONE,

    

    /** No bet to face - can check, bet, or fold */

    CHECK_BET_FOLD,

    

    /** Facing a bet - must call, raise, or fold */

    CALL_RAISE_FOLD,

    

    /** Big blind special case - can check or raise after limps */

    CHECK_RAISE_FOLD

}



/**

    * Base interface for all poker players.

    * Both AI and human players implement this interface.

 */

interface PokerPlayer {

    /** Physical seat at the table (0-9) */

    val seatIndex: Int

    

    /** Position name (BTN, SB, BB, UTG, etc.) */

    var position: String

    

    /** Current chip stack */

    var stack: Double

    

    /** Bet placed in current betting round */

    var currentBet: Double

    

    /** Player's hole cards */

    val holeCards: MutableList<Card>

    

    /** Whether player has folded this hand */

    var isFolded: Boolean

    

    /** Whether player is all-in */

    var isAllIn: Boolean

    

    /** Last action display string */

    var lastAction: String?

    

    /** Whether this player can currently take an action */

    fun canAct(): Boolean = !isFolded && !isAllIn && stack > 0

    

    /** Reset state for new hand */

    fun reset()

    

    /** Convert to DTO for API response */

    fun toDto(showCards: Boolean): PlayerDto

}



/**

    * Human player controlled by user input.

 */

data class HumanPlayer(

    override val seatIndex: Int,

    override var position: String = "",

    override var stack: Double,

    override var currentBet: Double = 0.0,

    override val holeCards: MutableList<Card> = mutableListOf(),

    override var isFolded: Boolean = false,

    override var isAllIn: Boolean = false,

    override var lastAction: String? = null

) : PokerPlayer {

    

    override fun reset() {

        holeCards.clear()

        currentBet = 0.0

        isFolded = false

        isAllIn = false

        lastAction = null

    }

    

    override fun toDto(showCards: Boolean): PlayerDto {

        return PlayerDto(

            seatIndex = seatIndex,

            position = position,

            stack = stack,

            holeCards = if (showCards) holeCards.map { it.toDto() } else null,

            lastAction = lastAction,

            isFolded = isFolded,

            isAllIn = isAllIn,

            currentBet = currentBet,

            isHero = true

        )

    }

}



/**

    * AI player with automated decision making.

 */

data class AiPlayer(

    override val seatIndex: Int,

    override var position: String = "",

    override var stack: Double,

    override var currentBet: Double = 0.0,

    override val holeCards: MutableList<Card> = mutableListOf(),

    override var isFolded: Boolean = false,

    override var isAllIn: Boolean = false,

    override var lastAction: String? = null

) : PokerPlayer {

    

    override fun reset() {

        holeCards.clear()

        currentBet = 0.0

        isFolded = false

        isAllIn = false

        lastAction = null

    }

    

    override fun toDto(showCards: Boolean): PlayerDto {

        return PlayerDto(

            seatIndex = seatIndex,

            position = position,

            stack = stack,

            holeCards = if (showCards) holeCards.map { it.toDto() } else null,

            lastAction = lastAction,

            isFolded = isFolded,

            isAllIn = isAllIn,

            currentBet = currentBet,

            isHero = false

        )

    }

}

```

### 1.2 Update GameState Model

**File:** `backend/src/main/kotlin/com/mako/service/GameService.kt`

**Changes to GameState:**

```kotlin

data class GameState(

    val id: UUID,

    var playerCount: Int,

    

    // === PLAYER MANAGEMENT ===

    

    /** 

                    * All players at the table, indexed by seat.

                    * Use this for seat-based lookups.

     */

    val playersBySeat: MutableMap<Int, PokerPlayer>,

    

    /**

                    * Players ordered by action sequence.

                    * Reordered each hand: SB at index 0, BTN at last index.

                    * This is the primary list for turn iteration.

     */

    val actionOrder: MutableList<PokerPlayer>,

    

    /**

                    * Available actions for each player by seat index.

                    * Updated after each action and street change.

     */

    val availableActions: MutableMap<Int, AvailableActions>,

    

    // === POSITION TRACKING ===

    

    val heroSeatIndex: Int,

    var dealerSeatIndex: Int,

    

    /**

                    * Index into actionOrder for current actor.

                    * -1 means no one is currently acting.

     */

    var currentActorIndex: Int,

    

    // === BETTING STATE ===

    

    var pot: Double,

    var street: String,

    val communityCards: MutableList<Card>,

    var isHandInProgress: Boolean,

    var blinds: BlindsDto,

    var deck: MutableList<Card>,

    var lastBet: Double = 0.0,

    var minRaise: Double = 0.0,

    

    /**

                    * Tracks who has had a chance to act this betting round.

                    * Reset when a new bet/raise is made or new street starts.

     */

    var lastAggressorIndex: Int = -1,

    

    // === HAND RESULT ===

    

    var winner: PokerPlayer? = null,

    var winningHand: String? = null

)

```

---

## Phase 2: Action Order Management

### 2.1 Create ActionOrderManager

**File:** `backend/src/main/kotlin/com/mako/service/ActionOrderManager.kt` (new file)

```kotlin

package com.mako.service



import com.mako.model.AvailableActions

import com.mako.model.PokerPlayer

import com.mako.service.GameConstants.STREET_PREFLOP



/**

    * Manages player action order and available actions.

    * 

    * Responsibilities:

    * - Reordering players by action sequence each hand

    * - Tracking and updating available actions

    * - Determining next player to act

 */

@Service

class ActionOrderManager {

    

    /**

                    * Reorders players for a new hand.

                    * 

                    * Action order is clockwise from the button:

                    * - Full ring: SB (0), BB (1), UTG (2), ..., BTN (last)

                    * - Heads-up: SB/BTN (0), BB (1) - button posts SB

                    * 

                    * @param players All players by seat

                    * @param dealerSeatIndex Current button position

                    * @return List ordered by action sequence

     */

    fun buildActionOrder(

        players: Map<Int, PokerPlayer>,

        dealerSeatIndex: Int

    ): MutableList<PokerPlayer> {

        val sortedBySeat = players.values.toList()

            .sortedBy { it.seatIndex }

        

        if (sortedBySeat.size == 2) {

            // Heads-up: BTN posts SB and acts first preflop

            // Order: BTN (SB), other player (BB)

            val btnPlayer = sortedBySeat.find { it.seatIndex == dealerSeatIndex }

                ?: sortedBySeat.first()

            val bbPlayer = sortedBySeat.find { it != btnPlayer }!!

            return mutableListOf(btnPlayer, bbPlayer)

        }

        

        // Full ring: SB is first clockwise from button

        val sbSeatIndex = findNextOccupiedSeat(

            players, 

            dealerSeatIndex

        )

        

        // Build order starting from SB

        val ordered = mutableListOf<PokerPlayer>()

        var currentSeat = sbSeatIndex

        var count = 0

        

        while (count < sortedBySeat.size) {

            players[currentSeat]?.let { ordered.add(it) }

            currentSeat = findNextOccupiedSeat(players, currentSeat)

            count++

        }

        

        return ordered

    }

    

    /**

                    * Updates available actions for all players.

                    * 

                    * @param game Current game state

     */

    fun updateAvailableActions(game: GameState) {

        for (player in game.actionOrder) {

            game.availableActions[player.seatIndex] = 

                calculateAvailableActions(game, player)

        }

    }

    

    /**

                    * Calculates what actions a specific player can take.

     */

    private fun calculateAvailableActions(

        game: GameState, 

        player: PokerPlayer

    ): AvailableActions {

        // Can't act if folded or all-in

        if (player.isFolded || player.isAllIn) {

            return AvailableActions.NONE

        }

        

        // Can't act if not enough stack

        if (player.stack <= 0) {

            return AvailableActions.NONE

        }

        

        val toCall = game.lastBet - player.currentBet

        

        // No bet to face

        if (toCall <= 0) {

            // Special case: BB preflop with no raise

            if (game.street == STREET_PREFLOP && 

                player.position == "BB" &&

                player.lastAction == ACTION_BB) {

                return AvailableActions.CHECK_RAISE_FOLD

            }

            return AvailableActions.CHECK_BET_FOLD

        }

        

        // Facing a bet

        return AvailableActions.CALL_RAISE_FOLD

    }

    

    /**

                    * Finds the next player who can act.

                    * 

                    * @param game Current game state

                    * @param fromIndex Start searching after this index

                    * @return Index of next actor, or -1 if betting round complete

     */

    fun findNextActor(game: GameState, fromIndex: Int): Int {

        val playerCount = game.actionOrder.size

        var checked = 0

        var index = (fromIndex + 1) % playerCount

        

        while (checked < playerCount) {

            val player = game.actionOrder[index]

            val actions = game.availableActions[player.seatIndex]

            

            if (actions != null && actions != AvailableActions.NONE) {

                // Check if this player needs to act

                if (needsToAct(game, player, index)) {

                    return index

                }

            }

            

            index = (index + 1) % playerCount

            checked++

        }

        

        return -1 // Betting round complete

    }

    

    /**

                    * Determines if a player needs to act this betting round.

                    * 

                    * A player needs to act if:

                    * - They haven't acted yet this round

                    * - OR someone raised after their last action

     */

    private fun needsToAct(

        game: GameState, 

        player: PokerPlayer,

        playerIndex: Int

    ): Boolean {

        // Never acted this round

        if (player.lastAction in listOf(null, ACTION_SB, ACTION_BB)) {

            return true

        }

        

        // Someone raised after this player's action

        if (game.lastAggressorIndex != -1 && 

            game.lastAggressorIndex != playerIndex) {

            val toCall = game.lastBet - player.currentBet

            if (toCall > 0) {

                return true

            }

        }

        

        return false

    }

    

    private fun findNextOccupiedSeat(

        players: Map<Int, PokerPlayer>, 

        fromSeat: Int

    ): Int {

        var seat = (fromSeat + 1) % 10

        var checked = 0

        while (checked < 10) {

            if (players.containsKey(seat)) {

                return seat

            }

            seat = (seat + 1) % 10

            checked++

        }

        throw IllegalStateException("No next seat found")

    }

}

```

---

## Phase 3: Unified Betting Round Logic

### 3.1 Create BettingRoundManager

**File:** `backend/src/main/kotlin/com/mako/service/BettingRoundManager.kt` (new file)

```kotlin

package com.mako.service



import com.mako.model.AvailableActions

import com.mako.model.PokerPlayer

import com.mako.service.GameConstants.*



/**

    * Manages betting round flow for all streets.

    * 

    * Provides unified logic for:

    * - Starting a new betting round

    * - Processing player actions

    * - Determining when betting is complete

 */

@Service

class BettingRoundManager(

    private val actionOrderManager: ActionOrderManager

) {

    

    /**

                    * Starts a new betting round.

                    * 

                    * For preflop: Posts blinds, sets action to UTG (or BTN heads-up)

                    * For post-flop: Resets bets, sets action to SB or first active

                    * 

                    * @param game Current game state

                    * @param isPreflop Whether this is the preflop round

     */

    fun startBettingRound(game: GameState, isPreflop: Boolean) {

        // Reset betting state

        game.lastBet = 0.0

        game.minRaise = game.blinds.big

        game.lastAggressorIndex = -1

        

        // Reset player bets (except blinds for preflop)

        for (player in game.actionOrder) {

            if (!isPreflop) {

                player.currentBet = 0.0

                player.lastAction = null

            }

        }

        

        if (isPreflop) {

            postBlinds(game)

        }

        

        // Update available actions for all players

        actionOrderManager.updateAvailableActions(game)

        

        // Find first player to act

        game.currentActorIndex = findFirstToAct(game, isPreflop)

    }

    

    /**

                    * Posts small and big blinds.

                    * SB is at actionOrder[0], BB is at actionOrder[1].

     */

    private fun postBlinds(game: GameState) {

        val sb = game.actionOrder[0]

        val bb = game.actionOrder[1]

        

        // Post small blind

        val sbAmount = minOf(game.blinds.small, sb.stack)

        sb.stack -= sbAmount

        sb.currentBet = sbAmount

        sb.lastAction = ACTION_SB

        game.pot += sbAmount

        

        // Post big blind

        val bbAmount = minOf(game.blinds.big, bb.stack)

        bb.stack -= bbAmount

        bb.currentBet = bbAmount

        bb.lastAction = ACTION_BB

        game.pot += bbAmount

        

        // Set betting state

        game.lastBet = game.blinds.big

        game.minRaise = game.blinds.big * 2

    }

    

    /**

                    * Finds first player to act.

                    * 

                    * Preflop: UTG (index 2) or BTN for heads-up

                    * Post-flop: SB (index 0) or first active player

     */

    private fun findFirstToAct(game: GameState, isPreflop: Boolean): Int {

        if (isPreflop) {

            // Preflop: First to act is UTG (after BB) or BTN for heads-up

            if (game.actionOrder.size == 2) {

                // Heads-up: BTN acts first (index 0)

                return 0

            }

            // Full ring: UTG is first (index 2, after SB and BB)

            return 2

        }

        

        // Post-flop: Find first active player from SB

        for (i in game.actionOrder.indices) {

            val player = game.actionOrder[i]

            if (player.canAct()) {

                return i

            }

        }

        

        return -1 // No active players

    }

    

    /**

                    * Checks if the current betting round is complete.

                    * 

                    * Complete when:

                    * - All active players have matched the current bet

                    * - AND no one has an unresolved action

     */

    fun isBettingRoundComplete(game: GameState): Boolean {

        val activePlayers = game.actionOrder.filter { it.canAct() }

        

        // All players folded or all-in

        if (activePlayers.isEmpty()) {

            return true

        }

        

        // Check if all active players have matched the bet

        for (player in activePlayers) {

            // Player hasn't acted or needs to respond to raise

            if (player.lastAction in listOf(null, ACTION_SB, ACTION_BB)) {

                return false

            }

            

            // Player bet doesn't match (unless checked)

            val toCall = game.lastBet - player.currentBet

            if (toCall > 0) {

                return false

            }

        }

        

        return true

    }

    

    /**

                    * Processes a player action and advances game state.

                    * 

                    * @return true if betting round is complete

     */

    fun processAction(

        game: GameState, 

        player: PokerPlayer,

        action: String,

        amount: Double?

    ): Boolean {

        when (action) {

            INPUT_FOLD -> handleFold(player)

            INPUT_CHECK -> handleCheck(player)

            INPUT_CALL -> handleCall(game, player)

            INPUT_BET, INPUT_RAISE -> handleBetRaise(game, player, amount)

            INPUT_ALLIN -> handleAllIn(game, player)

        }

        

        // Update available actions

        actionOrderManager.updateAvailableActions(game)

        

        // Find next actor

        val nextActor = actionOrderManager.findNextActor(

            game, 

            game.currentActorIndex

        )

        

        if (nextActor == -1) {

            return true // Betting complete

        }

        

        game.currentActorIndex = nextActor

        return false

    }

    

    private fun handleFold(player: PokerPlayer) {

        player.isFolded = true

        player.lastAction = ACTION_FOLD

    }

    

    private fun handleCheck(player: PokerPlayer) {

        player.lastAction = ACTION_CHECK

    }

    

    private fun handleCall(game: GameState, player: PokerPlayer) {

        val toCall = game.lastBet - player.currentBet

        val actualCall = minOf(toCall, player.stack)

        

        player.stack -= actualCall

        player.currentBet += actualCall

        game.pot += actualCall

        

        if (player.stack == 0.0) {

            player.isAllIn = true

            player.lastAction = ACTION_ALL_IN

        } else {

            player.lastAction = ACTION_CALL

        }

    }

    

    private fun handleBetRaise(

        game: GameState, 

        player: PokerPlayer, 

        amount: Double?

    ) {

        val raiseAmount = maxOf(amount ?: game.minRaise, game.minRaise)

        val totalBet = minOf(raiseAmount, player.stack + player.currentBet)

        val amountToAdd = totalBet - player.currentBet

        

        player.stack -= amountToAdd

        player.currentBet = totalBet

        game.pot += amountToAdd

        

        // Update betting state

        game.minRaise = totalBet + (totalBet - game.lastBet)

        game.lastBet = totalBet

        game.lastAggressorIndex = game.currentActorIndex

        

        if (player.stack == 0.0) {

            player.isAllIn = true

            player.lastAction = ACTION_ALL_IN

        } else {

            val bbAmount = game.blinds.big

            val raiseBBs = (totalBet / bbAmount).toInt()

            player.lastAction = "Raise ${raiseBBs}BB"

        }

    }

    

    private fun handleAllIn(game: GameState, player: PokerPlayer) {

        val allInAmount = player.stack + player.currentBet

        val amountToAdd = player.stack

        

        game.pot += amountToAdd

        

        if (allInAmount > game.lastBet) {

            game.minRaise = allInAmount + (allInAmount - game.lastBet)

            game.lastBet = allInAmount

            game.lastAggressorIndex = game.currentActorIndex

        }

        

        player.currentBet = allInAmount

        player.stack = 0.0

        player.isAllIn = true

        player.lastAction = ACTION_ALL_IN

    }

}

```

---

## Phase 4: Updated GameService Integration

### 4.1 Refactored GameService

**Changes to:** `backend/src/main/kotlin/com/mako/service/GameService.kt`

```kotlin

@Service

class GameService(

    private val aiPlayerService: AiPlayerService,

    private val actionOrderManager: ActionOrderManager,

    private val bettingRoundManager: BettingRoundManager

) {

    // ... existing fields ...

    

    fun dealHand(gameId: UUID): GameStateResponse {

        val game = games[gameId] ?: throw IllegalArgumentException("...")

        

        // ... reset game state ...

        

        // Move button

        game.dealerSeatIndex = findNextOccupiedSeat(game.dealerSeatIndex)

        

        // Rebuild action order for new hand

        game.actionOrder.clear()

        game.actionOrder.addAll(

            actionOrderManager.buildActionOrder(

                game.playersBySeat, 

                game.dealerSeatIndex

            )

        )

        

        // Assign positions

        assignPositions(game)

        

        // Deal cards

        dealHoleCards(game)

        

        // Start preflop betting

        game.street = STREET_PREFLOP

        game.isHandInProgress = true

        bettingRoundManager.startBettingRound(game, isPreflop = true)

        

        return gameToResponse(game)

    }

    

    fun processAction(

        gameId: UUID, 

        request: PlayerActionRequest

    ): GameStateResponse {

        val game = games[gameId] ?: throw IllegalArgumentException("...")

        

        val currentPlayer = game.actionOrder[game.currentActorIndex]

        

        // Validate action is available

        val available = game.availableActions[currentPlayer.seatIndex]

        validateAction(available, request.action)

        

        // Process the action

        val roundComplete = bettingRoundManager.processAction(

            game, 

            currentPlayer, 

            request.action, 

            request.amount

        )

        

        // Check for hand end (everyone folded)

        if (shouldEndHand(game)) {

            endHand(game)

        } else if (roundComplete) {

            advanceStreet(game)

        }

        

        return gameToResponse(game)

    }

    

    private fun advanceStreet(game: GameState) {

        when (game.street) {

            STREET_PREFLOP -> {

                dealFlop(game)

                bettingRoundManager.startBettingRound(game, isPreflop = false)

            }

            STREET_FLOP -> {

                dealTurn(game)

                bettingRoundManager.startBettingRound(game, isPreflop = false)

            }

            STREET_TURN -> {

                dealRiver(game)

                bettingRoundManager.startBettingRound(game, isPreflop = false)

            }

            STREET_RIVER -> goToShowdown(game)

        }

    }

}

```

---

## Phase 5: API Response Updates

### 5.1 Update DTOs

**File:** `backend/src/main/kotlin/com/mako/dto/GameDtos.kt`

```kotlin

// Add to GameStateResponse

data class GameStateResponse(

    // ... existing fields ...

    

    /** Available actions for the current player */

    val availableActions: String?,  // "CHECK_BET_FOLD", "CALL_RAISE_FOLD", etc.

    

    /** Players in action order (SB first, BTN last) */

    val actionOrderSeats: List<Int>

)

```

---

## Phase 6: Frontend Integration

### 6.1 Update Action Handling

**File:** `frontend/src/features/game/components/BettingControls/BettingControls.tsx`

Use `availableActions` from API response to show correct buttons:

```typescript

function BettingControls({ game }) {

    const { availableActions } = game

    

    // Show buttons based on available actions

    const showCheck = availableActions?.includes('CHECK')

    const showCall = availableActions?.includes('CALL')

    const showBet = availableActions?.includes('BET')

    const showRaise = availableActions?.includes('RAISE')

    const showFold = true  // Always available

    

    // ...

}

```

---

## Implementation Order

| Phase | Description | Estimated Effort |

|-------|-------------|-----------------|

| 1.1 | Create Player interface hierarchy | 2 hours |

| 1.2 | Update GameState model | 1 hour |

| 2.1 | Create ActionOrderManager | 3 hours |

| 3.1 | Create BettingRoundManager | 4 hours |

| 4.1 | Refactor GameService | 3 hours |

| 5.1 | Update DTOs | 1 hour |

| 6.1 | Frontend integration | 2 hours |

| - | Testing & debugging | 4 hours |

| **Total** | | **20 hours** |

---

## Testing Strategy

1. **Unit Tests for ActionOrderManager:**

            - Test action order for 2, 6, 9, 10 players

            - Test heads-up special case

            - Test available actions calculation

2. **Unit Tests for BettingRoundManager:**

            - Test preflop blind posting

            - Test betting round completion detection

            - Test each action type (fold, check, call, raise, all-in)

3. **Integration Tests:**

            - Full hand from deal to showdown

            - Edge cases: everyone folds preflop, all-in scenarios

            - Multi-way pots with side pots (future enhancement)

---

[1 tool called]

---

- **Phase 1:** Player interface hierarchy (`PokerPlayer`, `HumanPlayer`, `AiPlayer`)

- **Phase 2:** `ActionOrderManager` for player ordering and available actions

- **Phase 3:** `BettingRoundManager` for unified betting logic

- **Phase 4:** `GameService` integration

- **Phase 5:** API response updates

- **Phase 6:** Frontend integration

**Key architectural changes in the plan:**

- Players ordered by action sequence (SB first, BTN last)

- Explicit `AvailableActions` enum tracks what each player can do

- Unified betting logic for all streets with preflop blind handling

- Clear separation between AI and human players via interfaces

**Estimated implementation:** ~20 hours