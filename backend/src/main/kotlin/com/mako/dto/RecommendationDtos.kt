package com.mako.dto

import com.mako.model.PokerAction
import com.mako.model.Recommendation
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for GTO recommendation.
 */
data class RecommendationResponse(
    val id: UUID,
    val scenarioId: UUID,
    val recommendedAction: PokerAction,
    val actionConfidence: BigDecimal,
    val foldPct: BigDecimal,
    val callPct: BigDecimal,
    val raisePct: BigDecimal,
    val recommendedBetSize: BigDecimal?,
    val equity: BigDecimal,
    val expectedValue: BigDecimal?,
    val potOdds: String?,
    val calculationTimeMs: Int?,
    val solverIterations: Int?,
    val createdAt: Instant?
) {
    companion object {
        fun from(recommendation: Recommendation): RecommendationResponse =
            RecommendationResponse(
                id = recommendation.id!!,
                scenarioId = recommendation.scenario.id!!,
                recommendedAction = recommendation.recommendedAction,
                actionConfidence = recommendation.actionConfidence,
                foldPct = recommendation.foldPct,
                callPct = recommendation.callPct,
                raisePct = recommendation.raisePct,
                recommendedBetSize = recommendation.recommendedBetSize,
                equity = recommendation.equity,
                expectedValue = recommendation.expectedValue,
                potOdds = recommendation.potOdds,
                calculationTimeMs = recommendation.calculationTimeMs,
                solverIterations = recommendation.solverIterations,
                createdAt = recommendation.createdAt
            )
    }
}

/**
 * Combined response with scenario and recommendation.
 */
data class AnalysisResponse(
    val scenario: ScenarioResponse,
    val recommendation: RecommendationResponse,
    val cached: Boolean = false
)

/**
 * Response for async solver job.
 */
data class SolverJobResponse(
    val jobId: UUID,
    val status: SolverJobStatus,
    val progress: Int = 0,
    val estimatedTimeMs: Long? = null
)

/**
 * Status of a solver job.
 */
enum class SolverJobStatus {
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED
}

/**
 * Detailed strategy output from solver.
 */
data class StrategyResponse(
    val actions: Map<PokerAction, ActionStrategy>,
    val equity: BigDecimal,
    val ev: Map<PokerAction, BigDecimal>,
    val iterations: Int,
    val convergence: Double
)

/**
 * Strategy for a specific action.
 */
data class ActionStrategy(
    val frequency: BigDecimal,
    val betSizes: List<BetSizeStrategy>? = null
)

/**
 * Strategy for a specific bet size.
 */
data class BetSizeStrategy(
    val size: BigDecimal,
    val frequency: BigDecimal
)

