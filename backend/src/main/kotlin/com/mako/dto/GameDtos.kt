package com.mako.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import java.util.UUID

/**
 * Request DTO for starting a new game.
 */
data class StartGameRequest(
    @field:Min(2)
    @field:Max(10)
    val playerCount: Int = 6,
    val startingStack: Double = 100.0,
    val smallBlind: Double = 0.5,
    val bigBlind: Double = 1.0
)

/**
 * Request DTO for submitting a player action.
 */
data class PlayerActionRequest(
    val action: String,
    val amount: Double? = null
)

/**
 * Request DTO for updating blind sizes.
 */
data class UpdateBlindsRequest(
    @field:Min(1)
    val smallBlind: Double,
    @field:Min(1)
    val bigBlind: Double
)

/**
 * Represents a playing card.
 */
data class CardDto(
    val rank: String,
    val suit: String,
    val display: String
)

/**
 * Represents a player at the table.
 */
data class PlayerDto(
    val seatIndex: Int,
    val position: String,
    val stack: Double,
    val holeCards: List<CardDto>?,
    val lastAction: String?,
    val isFolded: Boolean,
    val isAllIn: Boolean,
    val currentBet: Double,
    val isHero: Boolean
)

/**
 * Represents blinds configuration.
 */
data class BlindsDto(
    val small: Double,
    val big: Double
)

/**
 * Represents a side pot for all-in scenarios.
 */
data class SidePotDto(
    val id: Int,
    val amount: Double,
    val eligiblePlayerSeats: List<Int>,
    val capPerPlayer: Double,
    val isMainPot: Boolean,
    val displayName: String
)

/**
 * Response DTO for game state.
 * dealerSeatIndex: Physical seat (0-9) where button is located.
 * currentPlayerIndex: Index into players array for current turn.
 */
data class GameStateResponse(
    val id: UUID,
    val playerCount: Int,
    val players: List<PlayerDto>,
    val heroSeatIndex: Int,
    val dealerSeatIndex: Int,
    val currentPlayerIndex: Int,
    val pot: Double,
    val street: String,
    val communityCards: List<CardDto>,
    val isHandInProgress: Boolean,
    val blinds: BlindsDto,
    val minRaise: Double,
    val maxRaise: Double,
    val toCall: Double,
    val winner: PlayerDto?,
    val winningHand: String?,
    /** Available actions for current player (CHECK_BET_FOLD, CALL_RAISE_FOLD, etc.) */
    val availableActions: String? = null,
    /** Player seat indices in action order (SB first, BTN last) */
    val actionOrderSeats: List<Int>? = null,
    /** Whether hand has reached showdown (AI cards should be revealed) */
    val isShowdown: Boolean = false,
    /** Side pots for all-in scenarios */
    val sidePots: List<SidePotDto> = emptyList(),
    /** Player contributions this hand (seat index -> amount) */
    val playerContributions: Map<Int, Double> = emptyMap()
)

