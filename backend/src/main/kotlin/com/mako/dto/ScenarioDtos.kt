package com.mako.dto

import com.mako.enums.Position
import com.mako.model.Scenario
import com.mako.enums.Street
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Request DTO for creating a scenario and requesting GTO analysis.
 */
data class AnalyzeRequest(
    @field:NotBlank(message = "Hole cards are required")
    @field:Pattern(
        regexp = "^[2-9TJQKA][shdc][2-9TJQKA][shdc]$",
        message = "Invalid hole cards format (e.g., 'AsKh')"
    )
    val holeCards: String,

    @field:Pattern(
        regexp = "^([2-9TJQKA][shdc]){0,5}$",
        message = "Invalid community cards format"
    )
    val communityCards: String? = null,

    @field:NotNull(message = "Position is required")
    val position: Position,

    @field:Min(2, message = "Minimum 2 players")
    @field:Max(10, message = "Maximum 10 players")
    val playerCount: Int,

    @field:Positive(message = "Player stack must be positive")
    val playerStack: BigDecimal,

    @field:PositiveOrZero(message = "Pot size must be non-negative")
    val potSize: BigDecimal,

    @field:NotBlank(message = "Blinds are required")
    val blinds: String,

    val street: Street = Street.PREFLOP,

    val actionFacing: String? = null,

    val sessionId: UUID? = null,

    // Solver configuration options
    val useCache: Boolean = true,
    val solverIterations: Int? = null
)

/**
 * Response DTO for scenario information.
 */
data class ScenarioResponse(
    val id: UUID,
    val holeCards: String,
    val communityCards: String?,
    val position: Position,
    val playerCount: Int,
    val playerStack: BigDecimal,
    val potSize: BigDecimal,
    val blinds: String,
    val street: Street,
    val actionFacing: String?,
    val createdAt: Instant?
) {
    companion object {
        fun from(scenario: Scenario): ScenarioResponse = ScenarioResponse(
            id = scenario.id!!,
            holeCards = scenario.holeCards,
            communityCards = scenario.communityCards,
            position = scenario.position,
            playerCount = scenario.playerCount,
            playerStack = scenario.playerStack,
            potSize = scenario.potSize,
            blinds = scenario.blinds,
            street = scenario.street,
            actionFacing = scenario.actionFacing,
            createdAt = scenario.createdAt
        )
    }
}

