package com.mako.service

import com.mako.dto.*
import com.mako.model.AiPlayer
import com.mako.model.Card
import com.mako.model.HumanPlayer
import com.mako.model.PokerPlayer
import com.mako.service.GameConstants.ACTION_ALL_IN
import com.mako.service.GameConstants.ACTION_BB
import com.mako.service.GameConstants.ACTION_CALL
import com.mako.service.GameConstants.ACTION_CHECK
import com.mako.service.GameConstants.ACTION_FOLD
import com.mako.service.GameConstants.ACTION_SB
import com.mako.service.GameConstants.DEFAULT_STARTING_STACK
import com.mako.service.GameConstants.HERO_SEAT_INDEX
import com.mako.service.GameConstants.INITIAL_POT
import com.mako.service.GameConstants.INPUT_ALLIN
import com.mako.service.GameConstants.INPUT_BET
import com.mako.service.GameConstants.INPUT_CALL
import com.mako.service.GameConstants.INPUT_CHECK
import com.mako.service.GameConstants.INPUT_FOLD
import com.mako.service.GameConstants.INPUT_RAISE
import com.mako.service.GameConstants.MAX_PLAYERS
import com.mako.service.GameConstants.MAX_SEAT_INDEX
import com.mako.service.GameConstants.MIN_PLAYERS
import com.mako.service.GameConstants.MIN_SEAT_INDEX
import com.mako.service.GameConstants.NO_CURRENT_PLAYER
import com.mako.service.GameConstants.POSITIONS_BY_COUNT
import com.mako.service.GameConstants.STREET_FLOP
import com.mako.service.GameConstants.STREET_PREFLOP
import com.mako.service.GameConstants.STREET_RIVER
import com.mako.service.GameConstants.STREET_SHOWDOWN
import com.mako.service.GameConstants.STREET_TURN
import com.mako.service.GameConstants.createStandardDeck
import com.mako.model.SidePot
import org.springframework.stereotype.Service
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.random.Random

/**
 * Represents the current game state.
 * Stack values are stored in absolute terms (dollars/chips).
 * BB display is calculated from stack/bigBlind ratio.
 *
 * SEAT vs PLAYER INDEX:
 * - dealerSeatIndex: Physical seat position (0-9), can be empty (dead button)
 * - currentPlayerIndex: Index into players array for turn tracking
 *
 * POT TRACKING:
 * - pot: Simple total pot for display (sum of all contributions)
 * - playerContributions: Tracks each player's total contribution this hand
 * - sidePots: Calculated at showdown for proper pot distribution
 */
data class GameState(
    val id: UUID,
    var playerCount: Int,
    val players: MutableList<PokerPlayer>,
    val heroSeatIndex: Int,
    var dealerSeatIndex: Int,
    var currentPlayerIndex: Int,
    var pot: Double,
    var street: String,
    val communityCards: MutableList<Card>,
    var isHandInProgress: Boolean,
    var blinds: BlindsDto,
    var deck: MutableList<Card>,
    var lastBet: Double = 0.0,
    var minRaise: Double = 0.0,
    var winner: PokerPlayer? = null,
    var winningHand: String? = null,
    val playerContributions: MutableMap<Int, Double> = mutableMapOf(),
    var sidePots: List<SidePot> = emptyList()
)

/**
 * Service for managing poker game state with in-memory storage.
 */
/**
 * Service for managing poker game state with in-memory storage.
 * 
 * Handles all game logic including dealing, betting rounds, and hand resolution.
 * Uses constants from GameConstants for configuration values.
 * Delegates AI decisions to AiPlayerService for separation of concerns.
 */
@Service
class GameService(
    private val aiPlayerService: AiPlayerService,
    private val potManager: PotManager,
    private val showdownService: ShowdownService
) {

    private val games = ConcurrentHashMap<UUID, GameState>()

    /**
     * Finds the next occupied seat clockwise from a given seat.
     * Skips empty seats - returns first seat with an active player.
     * 
     * Example: If fromSeat=5 and seats 6,7,8 are empty but 9 is occupied,
     * this returns 9.
     * 
     * @param fromSeat The seat to start searching FROM (exclusive)
     * @return The next occupied seat index, or null if no players
     */
    private fun findNextOccupiedSeat(game: GameState, fromSeat: Int): Int? {
        var currentSeat = (fromSeat + 1) % (MAX_SEAT_INDEX + 1)
        var checked = 0

        while (checked <= MAX_SEAT_INDEX) {
            val player = game.players.find { it.seatIndex == currentSeat }
            if (player != null) {
                return currentSeat
            }
            currentSeat = (currentSeat + 1) % (MAX_SEAT_INDEX + 1)
            checked++
        }
        return null
    }

    /**
     * Gets player at a specific seat, or null if seat is empty.
     */
    private fun getPlayerAtSeat(game: GameState, seatIndex: Int): PokerPlayer? {
        return game.players.find { it.seatIndex == seatIndex }
    }

    /**
     * Converts seat index to player array index.
     */
    private fun seatIndexToPlayerIndex(game: GameState, seatIndex: Int): Int? {
        return game.players.indexOfFirst { it.seatIndex == seatIndex }
            .takeIf { it >= 0 }
    }

    /**
     * Creates a fresh shuffled deck.
     */
    private fun createDeck(): MutableList<Card> {
        val deck = createStandardDeck()
        deck.shuffle(Random)
        return deck
    }

    /**
     * Starts a new game with the specified configuration.
     */
    fun startGame(userId: UUID, request: StartGameRequest): GameStateResponse {
        val gameId = UUID.randomUUID()

        val players = mutableListOf<PokerPlayer>()
        for (i in 0 until request.playerCount) {
            val isHero = i == HERO_SEAT_INDEX
            players.add(
                if (isHero) {
                    HumanPlayer(
                        seatIndex = i,
                        position = "",
                        stack = request.startingStack
                    )
                } else {
                    AiPlayer(
                        seatIndex = i,
                        position = "",
                        stack = request.startingStack
                    )
                }
            )
        }

        // Initial button position: last occupied seat (highest seat index)
        val initialButtonSeat = players.maxOf { it.seatIndex }

        val game = GameState(
            id = gameId,
            playerCount = request.playerCount,
            players = players,
            heroSeatIndex = HERO_SEAT_INDEX,
            dealerSeatIndex = initialButtonSeat,
            currentPlayerIndex = NO_CURRENT_PLAYER,
            pot = INITIAL_POT,
            street = STREET_PREFLOP,
            communityCards = mutableListOf(),
            isHandInProgress = false,
            blinds = BlindsDto(request.smallBlind, request.bigBlind),
            deck = createDeck()
        )

        assignPositions(game)
        games[gameId] = game
        games[userId] = game

        return gameToResponse(game)
    }

    /**
     * Gets the current game state.
     */
    fun getGame(gameId: UUID): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")
        return gameToResponse(game)
    }

    /**
     * Gets the user's current game.
     */
    fun getUserGame(userId: UUID): GameStateResponse? {
        val game = games[userId] ?: return null
        return gameToResponse(game)
    }

    /**
     * Deals a new hand.
     */
    fun dealHand(gameId: UUID): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (game.isHandInProgress) {
            throw IllegalStateException("Hand already in progress")
        }

        game.deck = createDeck()
        game.pot = INITIAL_POT
        game.communityCards.clear()
        game.street = STREET_PREFLOP
        game.winner = null
        game.winningHand = null
        game.sidePots = emptyList()

        // Reset contributions for new hand
        potManager.resetContributions(game.playerContributions)

        // Reset all players
        game.players.forEach { it.reset() }

        // Move dealer button clockwise to the NEXT OCCUPIED SEAT
        // Standard poker rule: button always moves to next active player
        val nextButtonSeat = findNextOccupiedSeat(game, game.dealerSeatIndex)
            ?: throw IllegalStateException("No players found for button")
        game.dealerSeatIndex = nextButtonSeat
        assignPositions(game)

        // Deal hole cards
        for (player in game.players) {
            player.holeCards.add(game.deck.removeAt(0))
            player.holeCards.add(game.deck.removeAt(0))
        }

        // Post blinds - find actual players using seat-based logic
        val sbSeatIndex = getSmallBlindSeatIndex(game)
        val bbSeatIndex = getBigBlindSeatIndex(game)

        val sbPlayerIndex = seatIndexToPlayerIndex(game, sbSeatIndex)
            ?: throw IllegalStateException("No player found for small blind")
        val bbPlayerIndex = seatIndexToPlayerIndex(game, bbSeatIndex)
            ?: throw IllegalStateException("No player found for big blind")

        val sbPlayer = game.players[sbPlayerIndex]
        val sbAmount = minOf(game.blinds.small, sbPlayer.stack)
        sbPlayer.currentBet = sbAmount
        sbPlayer.stack -= sbAmount
        sbPlayer.lastAction = ACTION_SB
        if (sbPlayer.stack == 0.0) sbPlayer.isAllIn = true
        potManager.recordContribution(
            game.playerContributions,
            sbSeatIndex,
            sbAmount
        )

        val bbPlayer = game.players[bbPlayerIndex]
        val bbAmount = minOf(game.blinds.big, bbPlayer.stack)
        bbPlayer.currentBet = bbAmount
        bbPlayer.stack -= bbAmount
        bbPlayer.lastAction = ACTION_BB
        if (bbPlayer.stack == 0.0) bbPlayer.isAllIn = true
        potManager.recordContribution(
            game.playerContributions,
            bbSeatIndex,
            bbAmount
        )

        game.pot = sbAmount + bbAmount
        game.lastBet = bbAmount
        game.minRaise = bbAmount
        game.isHandInProgress = true

        // Set action to first player after BB
        game.currentPlayerIndex = getFirstToActPlayerIndex(game)

        return gameToResponse(game)
    }

    /**
     * Processes a player action.
     */
    fun processAction(gameId: UUID, request: PlayerActionRequest): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (!game.isHandInProgress) {
            throw IllegalStateException("No hand in progress")
        }

        val currentPlayer = game.players[game.currentPlayerIndex]

        when (request.action.lowercase()) {
            INPUT_FOLD -> handleFold(game, currentPlayer)
            INPUT_CALL, INPUT_CHECK -> handleCall(game, currentPlayer)
            INPUT_RAISE, INPUT_BET -> {
                handleRaise(game, currentPlayer, request.amount ?: game.minRaise)
            }
            INPUT_ALLIN -> handleAllIn(game, currentPlayer)
            else -> throw IllegalArgumentException("Invalid action: ${request.action}")
        }

        // Check for hand end (everyone folded)
        if (shouldEndHand(game)) {
            endHand(game)
        } else if (isBettingRoundComplete(game)) {
            // Betting round complete - advance to next street
            advanceStreet(game)
        } else {
            moveToNextPlayer(game)
        }

        return gameToResponse(game)
    }

    /**
     * Updates the player count during a game (legacy method).
     */
    fun updatePlayerCount(gameId: UUID, newCount: Int): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (game.isHandInProgress) {
            throw IllegalStateException("Cannot change player count during hand")
        }

        if (newCount < MIN_PLAYERS || newCount > MAX_PLAYERS) {
            throw IllegalArgumentException(
                "Player count must be between $MIN_PLAYERS and $MAX_PLAYERS"
            )
        }

        val startingStack = game.players.firstOrNull()?.stack 
            ?: DEFAULT_STARTING_STACK

        while (game.players.size < newCount) {
            val seatIndex = game.players.size
            game.players.add(
                AiPlayer(
                    seatIndex = seatIndex,
                    position = "",
                    stack = startingStack
                )
            )
        }
        while (game.players.size > newCount) {
            game.players.removeAt(game.players.size - 1)
        }

        game.playerCount = newCount
        
        // Ensure dealer seat is valid - if not occupied, keep it (dead button)
        // Button will be at an empty seat until next hand
        if (game.dealerSeatIndex > MAX_SEAT_INDEX) {
            game.dealerSeatIndex = MIN_SEAT_INDEX
        }
        
        assignPositions(game)

        return gameToResponse(game)
    }

    /**
     * Adds a player at a specific seat index.
     */
    fun addPlayerAtSeat(gameId: UUID, seatIndex: Int): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (game.isHandInProgress) {
            throw IllegalStateException("Cannot add player during hand")
        }

        if (seatIndex < MIN_SEAT_INDEX || seatIndex > MAX_SEAT_INDEX) {
            throw IllegalArgumentException(
                "Seat index must be between $MIN_SEAT_INDEX and $MAX_SEAT_INDEX"
            )
        }

        if (seatIndex == game.heroSeatIndex) {
            throw IllegalArgumentException("Cannot add player to hero seat")
        }

        val existingPlayer = game.players.find { it.seatIndex == seatIndex }
        if (existingPlayer != null) {
            throw IllegalArgumentException("Seat $seatIndex is already occupied")
        }

        val startingStack = game.players.firstOrNull()?.stack 
            ?: DEFAULT_STARTING_STACK
        val newPlayer = if (seatIndex == game.heroSeatIndex) {
            HumanPlayer(
                seatIndex = seatIndex,
                position = "",
                stack = startingStack
            )
        } else {
            AiPlayer(
                seatIndex = seatIndex,
                position = "",
                stack = startingStack
            )
        }

        game.players.add(newPlayer)
        game.players.sortBy { it.seatIndex }
        game.playerCount = game.players.size
        assignPositions(game)

        return gameToResponse(game)
    }

    /**
     * Removes a player from a specific seat index.
     */
    fun removePlayerAtSeat(gameId: UUID, seatIndex: Int): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (game.isHandInProgress) {
            throw IllegalStateException("Cannot remove player during hand")
        }

        if (seatIndex == game.heroSeatIndex) {
            throw IllegalArgumentException("Cannot remove the hero player")
        }

        val playerToRemove = game.players.find { it.seatIndex == seatIndex }
            ?: throw IllegalArgumentException("No player at seat $seatIndex")

        if (game.players.size <= MIN_PLAYERS) {
            throw IllegalStateException(
                "Cannot have fewer than $MIN_PLAYERS players"
            )
        }

        game.players.remove(playerToRemove)
        game.playerCount = game.players.size

        // Dead button rule: if button was at removed player's seat,
        // keep button at empty seat. Next hand will move it clockwise.
        // Button can now be at an empty seat (dead button scenario).
        
        assignPositions(game)

        return gameToResponse(game)
    }

    /**
     * Updates the blind sizes for a game.
     * Recalculates all stack displays as BB values.
     */
    fun updateBlinds(gameId: UUID, smallBlind: Double, bigBlind: Double): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (game.isHandInProgress) {
            throw IllegalStateException("Cannot change blinds during hand")
        }

        if (smallBlind <= 0 || bigBlind <= 0) {
            throw IllegalArgumentException("Blinds must be positive")
        }

        game.blinds = BlindsDto(smallBlind, bigBlind)

        return gameToResponse(game)
    }

    /**
     * Ends the current game.
     */
    fun endGame(gameId: UUID, userId: UUID) {
        games.remove(gameId)
        games.remove(userId)
    }

    /**
     * Processes AI actions when it's not the hero's turn.
     * Delegates decision-making to AiPlayerService.
     */
    fun processAiAction(gameId: UUID): GameStateResponse {
        val game = games[gameId]
            ?: throw IllegalArgumentException("Game not found")

        if (!game.isHandInProgress) {
            return gameToResponse(game)
        }

        val currentPlayer = game.players[game.currentPlayerIndex]
        if (currentPlayer.isHero) {
            return gameToResponse(game)
        }

        // Build context for AI decision
        val context = AiPlayerService.ActionContext(
            toCall = game.lastBet - currentPlayer.currentBet,
            playerStack = currentPlayer.stack,
            lastBet = game.lastBet,
            minRaise = game.minRaise,
            pot = game.pot,
            street = game.street,
            position = currentPlayer.position
        )

        // Delegate to AI service
        val action = aiPlayerService.determineAction(context)
        return processAction(gameId, action)
    }

    private fun handleFold(game: GameState, player: PokerPlayer) {
        player.isFolded = true
        player.lastAction = ACTION_FOLD
    }

    private fun handleCall(game: GameState, player: PokerPlayer) {
        val toCall = game.lastBet - player.currentBet
        if (toCall == 0.0) {
            player.lastAction = ACTION_CHECK
        } else {
            val actualCall = minOf(toCall, player.stack)
            player.stack -= actualCall
            player.currentBet += actualCall
            game.pot += actualCall
            
            potManager.recordContribution(
                game.playerContributions,
                player.seatIndex,
                actualCall
            )
            
            player.lastAction = if (actualCall < toCall) {
                ACTION_ALL_IN
            } else {
                ACTION_CALL
            }
            if (player.stack == 0.0) player.isAllIn = true
        }
    }

    private fun handleRaise(
        game: GameState,
        player: PokerPlayer,
        amount: Double
    ) {
        val toCall = game.lastBet - player.currentBet
        val minRaiseRequired = game.lastBet + game.minRaise
        
        // Validate minimum raise (unless going all-in)
        val isAllIn = amount >= player.stack + player.currentBet
        if (!isAllIn && amount < minRaiseRequired) {
            throw IllegalArgumentException(
                "Minimum raise is ${game.minRaise}. " +
                "Must raise to at least $minRaiseRequired (currently $amount)"
            )
        }

        val totalBet = minOf(amount, player.stack + player.currentBet)
        val amountToAdd = totalBet - player.currentBet
        
        player.stack -= amountToAdd
        game.pot += amountToAdd

        potManager.recordContribution(
            game.playerContributions,
            player.seatIndex,
            amountToAdd
        )

        // Calculate new minimum raise: size of this raise
        val raiseSize = totalBet - game.lastBet
        game.minRaise = raiseSize
        game.lastBet = totalBet
        player.currentBet = totalBet

        val raiseBBs = (raiseSize / game.blinds.big).toInt()
        player.lastAction = "RAISE ${raiseBBs} BB"

        if (player.stack == 0.0) {
            player.isAllIn = true
            player.lastAction = ACTION_ALL_IN
        }
    }

    private fun handleAllIn(game: GameState, player: PokerPlayer) {
        val allInAmount = player.stack + player.currentBet
        val amountToAdd = player.stack

        game.pot += amountToAdd
        
        // Track contribution
        potManager.recordContribution(
            game.playerContributions,
            player.seatIndex,
            amountToAdd
        )
        
        if (allInAmount > game.lastBet) {
            game.minRaise = allInAmount + (allInAmount - game.lastBet)
            game.lastBet = allInAmount
        }
        player.currentBet = allInAmount
        player.stack = 0.0
        player.isAllIn = true
        player.lastAction = ACTION_ALL_IN
    }

    /**
     * Checks if hand should end immediately (everyone folded).
     */
    private fun shouldEndHand(game: GameState): Boolean {
        val activePlayers = game.players.filter { !it.isFolded }
        return activePlayers.size == 1
    }

    /**
     * Checks if current betting round is complete.
     */
    private fun isBettingRoundComplete(game: GameState): Boolean {
        val activePlayers = game.players.filter { !it.isFolded && !it.isAllIn }
        
        // If all active players are all-in, betting is done
        if (activePlayers.isEmpty()) {
            return true
        }

        // All players have acted and bets are equal
        val maxBet = game.players.maxOfOrNull { it.currentBet } ?: 0.0
        val allActed = activePlayers.all { player ->
            player.currentBet == maxBet && 
            player.lastAction != null && 
            player.lastAction !in listOf(ACTION_SB, ACTION_BB)
        }

        return allActed
    }

    /**
     * Advances to next street or ends hand at showdown.
     * If all players are all-in, deals all remaining cards.
     */
    private fun advanceStreet(game: GameState) {
        val activePlayers = game.players.filter { !it.isFolded && !it.isAllIn }
        val allPlayersAllIn = activePlayers.isEmpty()

        if (allPlayersAllIn) {
            // Deal out remaining cards and go to showdown
            while (game.communityCards.size < 5) {
                game.deck.removeAt(0) // Burn
                game.communityCards.add(game.deck.removeAt(0))
            }
            game.street = STREET_RIVER
            goToShowdown(game)
        } else {
            when (game.street) {
                STREET_PREFLOP -> dealFlop(game)
                STREET_FLOP -> dealTurn(game)
                STREET_TURN -> dealRiver(game)
                STREET_RIVER -> goToShowdown(game)
                else -> endHand(game)
            }
        }
    }

    /**
     * Deals the flop (3 cards).
     */
    private fun dealFlop(game: GameState) {
        game.deck.removeAt(0) // Burn card
        repeat(3) {
            game.communityCards.add(game.deck.removeAt(0))
        }
        game.street = STREET_FLOP
        startNewBettingRound(game)
    }

    /**
     * Deals the turn (1 card).
     */
    private fun dealTurn(game: GameState) {
        game.deck.removeAt(0) // Burn card
        game.communityCards.add(game.deck.removeAt(0))
        game.street = STREET_TURN
        startNewBettingRound(game)
    }

    /**
     * Deals the river (1 card).
     */
    private fun dealRiver(game: GameState) {
        game.deck.removeAt(0) // Burn card
        game.communityCards.add(game.deck.removeAt(0))
        game.street = STREET_RIVER
        startNewBettingRound(game)
    }

    /**
     * Starts a new betting round (reset bets, find first to act).
     */
    private fun startNewBettingRound(game: GameState) {
        // Reset betting state
        game.lastBet = 0.0
        game.minRaise = game.blinds.big
        
        // Clear player bets and actions
        for (player in game.players) {
            player.currentBet = 0.0
            player.lastAction = null
        }

        // Post-flop: first to act is SB or first active after button
        game.currentPlayerIndex = getFirstToActPostFlop(game)
    }

    /**
     * Gets first player to act post-flop.
     * Should be SB or first active player clockwise from button.
     */
    private fun getFirstToActPostFlop(game: GameState): Int {
        // Start from button and go clockwise
        val sbSeat = if (game.playerCount == 2) {
            game.dealerSeatIndex
        } else {
            findNextOccupiedSeat(game, game.dealerSeatIndex)
                ?: throw IllegalStateException("No SB found")
        }
        
        // Find first active player from SB position
        var currentSeat = sbSeat
        var checked = 0
        
        while (checked <= MAX_SEAT_INDEX) {
            val player = game.players.find { 
                it.seatIndex == currentSeat && !it.isFolded && !it.isAllIn 
            }
            if (player != null) {
                return game.players.indexOf(player)
            }
            currentSeat = (currentSeat + 1) % (MAX_SEAT_INDEX + 1)
            checked++
        }
        
        throw IllegalStateException("No active players for post-flop action")
    }

    /**
     * Proceeds to showdown and determines winner.
     */
    private fun goToShowdown(game: GameState) {
        game.street = STREET_SHOWDOWN
        endHand(game)
    }

    private fun endHand(game: GameState) {
        val activePlayers = game.players.filter { !it.isFolded }
        val activeSeats = activePlayers.map { it.seatIndex }.toSet()

        // Calculate side pots
        game.sidePots = if (game.players.any { it.isAllIn }) {
            potManager.calculatePots(game.playerContributions, activeSeats)
        } else {
            potManager.createSimplePot(game.pot, activeSeats)
        }

        if (activePlayers.size == 1) {
            // Everyone else folded - award all pots to winner
            val winner = activePlayers.first()
            val result = showdownService.determineWinnerByFold(
                winner.seatIndex,
                game.sidePots
            )

            // Distribute winnings
            for (potWinner in result.potWinners) {
                winner.stack += potWinner.amountPerWinner
            }

            game.winner = winner
            game.winningHand = "Others folded"
        } else if (game.communityCards.size == 5) {
            // Showdown with full board - evaluate hands
            val showdownPlayers = activePlayers.map { player ->
                ShowdownPlayer(
                    seatIndex = player.seatIndex,
                    holeCards = player.holeCards.toList(),
                    isFolded = player.isFolded
                )
            }

            val result = showdownService.determineWinners(
                showdownPlayers,
                game.communityCards.toList(),
                game.sidePots
            )

            // Distribute winnings from each pot
            for (potWinner in result.potWinners) {
                for (winningSeat in potWinner.winnerSeats) {
                    val player = game.players.find { it.seatIndex == winningSeat }
                    player?.let { it.stack += potWinner.amountPerWinner }
                }
            }

            // Set winner info (for display - uses main pot winner)
            val mainPotResult = result.potWinners.firstOrNull()
            if (mainPotResult != null && mainPotResult.winnerSeats.isNotEmpty()) {
                val winningSeat = mainPotResult.winnerSeats.first()
                game.winner = game.players.find { it.seatIndex == winningSeat }
                game.winningHand = mainPotResult.handDescription
            }
        } else {
            // Multiple players but not full board (shouldn't happen normally)
            val winner = activePlayers.random()
            winner.stack += game.pot
            game.winner = winner
            game.winningHand = "Best hand"
        }

        // Reset for next hand
        game.pot = INITIAL_POT
        game.playerContributions.clear()
        game.sidePots = emptyList()
        game.isHandInProgress = false
        game.currentPlayerIndex = NO_CURRENT_PLAYER
    }

    private fun moveToNextPlayer(game: GameState) {
        var nextIndex = (game.currentPlayerIndex + 1) % game.playerCount
        var loopCount = 0

        while (loopCount < game.playerCount) {
            val player = game.players[nextIndex]
            if (!player.isFolded && !player.isAllIn) {
                game.currentPlayerIndex = nextIndex
                return
            }
            nextIndex = (nextIndex + 1) % game.playerCount
            loopCount++
        }

        // No valid next player found
        endHand(game)
    }

    /**
     * Assigns positions based on seat distance from button.
     * Handles dead button scenario where button may be at empty seat.
     */
    private fun assignPositions(game: GameState) {
        val positions = POSITIONS_BY_COUNT[game.playerCount] 
            ?: POSITIONS_BY_COUNT[MAX_PLAYERS]
            ?: throw IllegalStateException(
                "No position mapping for player count"
            )

        // Calculate clockwise distance from button for each occupied seat
        val seatsWithDistance = game.players.map { player ->
            val distance = (player.seatIndex - game.dealerSeatIndex + 
                (MAX_SEAT_INDEX + 1)) % (MAX_SEAT_INDEX + 1)
            Pair(player, distance)
        }.sortedBy { it.second }

        // Assign positions: first player clockwise = BTN (or SB if button empty)
        for ((index, pair) in seatsWithDistance.withIndex()) {
            val player = pair.first
            player.position = positions.getOrElse(index) { "?" }
        }
    }

    /**
     * Gets the seat index for small blind position.
     * Returns seat (not player array index).
     */
    private fun getSmallBlindSeatIndex(game: GameState): Int {
        return if (game.playerCount == 2) {
            // Heads-up: button posts small blind
            game.dealerSeatIndex
        } else {
            // Full ring: first occupied seat clockwise from button
            findNextOccupiedSeat(game, game.dealerSeatIndex)
                ?: throw IllegalStateException("No players for small blind")
        }
    }

    /**
     * Gets the seat index for big blind position.
     * Returns seat (not player array index).
     */
    private fun getBigBlindSeatIndex(game: GameState): Int {
        val sbSeat = getSmallBlindSeatIndex(game)
        return findNextOccupiedSeat(game, sbSeat)
            ?: throw IllegalStateException("No players for big blind")
    }

    /**
     * Gets first player to act (player array index).
     * In heads-up: button acts first. Full ring: UTG (first after BB).
     */
    private fun getFirstToActPlayerIndex(game: GameState): Int {
        return if (game.playerCount == 2) {
            // Heads-up: button acts first preflop
            seatIndexToPlayerIndex(game, game.dealerSeatIndex)
                ?: throw IllegalStateException("Button player not found")
        } else {
            // Full ring: first player after big blind
            val bbSeat = getBigBlindSeatIndex(game)
            val utgSeat = findNextOccupiedSeat(game, bbSeat)
                ?: throw IllegalStateException("No UTG player found")
            seatIndexToPlayerIndex(game, utgSeat)
                ?: throw IllegalStateException("UTG player not found")
        }
    }

    private fun gameToResponse(game: GameState): GameStateResponse {
        val isShowdown = game.street == STREET_SHOWDOWN || game.winner != null
        val showAllCards = isShowdown
        val currentPlayer = if (game.currentPlayerIndex != NO_CURRENT_PLAYER) {
            game.players[game.currentPlayerIndex]
        } else null
        val toCall = if (currentPlayer != null) {
            game.lastBet - currentPlayer.currentBet
        } else 0.0

        // Build action order seats for frontend
        val actionOrderSeats = buildActionOrderSeats(game)

        return GameStateResponse(
            id = game.id,
            playerCount = game.playerCount,
            players = game.players.map { it.toDto(showAllCards) },
            heroSeatIndex = game.heroSeatIndex,
            dealerSeatIndex = game.dealerSeatIndex,
            currentPlayerIndex = game.currentPlayerIndex,
            pot = game.pot,
            street = game.street,
            communityCards = game.communityCards.map { it.toDto() },
            isHandInProgress = game.isHandInProgress,
            blinds = game.blinds,
            minRaise = game.minRaise,
            maxRaise = currentPlayer?.stack?.plus(currentPlayer.currentBet) ?: 0.0,
            toCall = toCall,
            winner = game.winner?.toDto(true),
            winningHand = game.winningHand,
            availableActions = calculateAvailableActions(game, currentPlayer),
            actionOrderSeats = actionOrderSeats,
            isShowdown = isShowdown,
            sidePots = game.sidePots.map { pot ->
                SidePotDto(
                    id = pot.id,
                    amount = pot.amount,
                    eligiblePlayerSeats = pot.eligiblePlayerSeats.toList(),
                    capPerPlayer = pot.capPerPlayer,
                    isMainPot = pot.isMainPot,
                    displayName = pot.displayName
                )
            },
            playerContributions = game.playerContributions.toMap()
        )
    }

    /**
     * Calculates available actions for the current player.
     */
    private fun calculateAvailableActions(
        game: GameState,
        player: PokerPlayer?
    ): String? {
        if (player == null || !game.isHandInProgress) return null
        if (player.isFolded || player.isAllIn) return "NONE"

        val toCall = game.lastBet - player.currentBet

        return if (toCall <= 0) {
            // BB preflop special case
            if (game.street == STREET_PREFLOP &&
                player.position == "BB" &&
                player.lastAction == ACTION_BB) {
                "CHECK_RAISE_FOLD"
            } else {
                "CHECK_BET_FOLD"
            }
        } else {
            "CALL_RAISE_FOLD"
        }
    }

    /**
     * Builds action order seat list (SB first, BTN last).
     */
    private fun buildActionOrderSeats(game: GameState): List<Int> {
        if (game.players.isEmpty()) return emptyList()

        // Find SB seat (first seat clockwise from button)
        val sbSeat = findNextOccupiedSeat(game, game.dealerSeatIndex)
            ?: return game.players.map { it.seatIndex }

        // Build order starting from SB
        val orderedSeats = mutableListOf<Int>()
        var currentSeat = sbSeat
        var count = 0

        while (count < game.players.size) {
            if (game.players.any { it.seatIndex == currentSeat }) {
                orderedSeats.add(currentSeat)
            }
            currentSeat = findNextOccupiedSeat(game, currentSeat) ?: break
            count++
        }

        return orderedSeats
    }
}

