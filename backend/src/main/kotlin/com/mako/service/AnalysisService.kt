package com.mako.service

import com.mako.dto.*
import com.mako.model.*
import com.mako.repository.*
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

/**
 * Service for GTO poker analysis.
 * Coordinates between scenario creation and the solver engine.
 */
@Service
class AnalysisService(
    private val scenarioRepository: ScenarioRepository,
    private val recommendationRepository: RecommendationRepository,
    private val userRepository: UserRepository,
    private val sessionRepository: SessionRepository,
    private val solverService: SolverService
) {

    /**
     * Analyzes a poker scenario for an authenticated user.
     */
    @Transactional
    fun analyze(userId: UUID, request: AnalyzeRequest): AnalysisResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val session = request.sessionId?.let {
            sessionRepository.findById(it).orElse(null)
        }

        val scenario = createScenario(user, session, request)
        val savedScenario = scenarioRepository.save(scenario)

        val recommendation = solverService.solve(savedScenario, request)
        val savedRecommendation = recommendationRepository.save(recommendation)

        return AnalysisResponse(
            scenario = ScenarioResponse.from(savedScenario),
            recommendation = RecommendationResponse.from(savedRecommendation),
            cached = false
        )
    }

    /**
     * Quick analysis without authentication (uses cache/heuristics).
     */
    fun quickAnalyze(request: AnalyzeRequest): AnalysisResponse {
        // Check cache first
        val cachedResult = solverService.getCachedResult(request)
        if (cachedResult != null) {
            return cachedResult
        }

        // Use heuristic solver for quick results
        val heuristicResult = solverService.quickSolve(request)
        return heuristicResult
    }

    /**
     * Gets an existing analysis by scenario ID.
     */
    @Transactional(readOnly = true)
    fun getAnalysis(scenarioId: UUID, userId: UUID): AnalysisResponse {
        val scenario = scenarioRepository.findById(scenarioId)
            .orElseThrow { IllegalArgumentException("Scenario not found") }

        if (scenario.user.id != userId) {
            throw IllegalArgumentException("Access denied")
        }

        val recommendation = recommendationRepository.findLatestByScenarioId(scenarioId)
            ?: throw IllegalArgumentException("No recommendation found")

        return AnalysisResponse(
            scenario = ScenarioResponse.from(scenario),
            recommendation = RecommendationResponse.from(recommendation)
        )
    }

    /**
     * Gets analysis history for a user.
     */
    @Transactional(readOnly = true)
    fun getHistory(userId: UUID, page: Int, size: Int): List<ScenarioResponse> {
        val pageable = PageRequest.of(page, size)
        val scenarios = scenarioRepository.findRecentByUserId(userId, pageable)
        return scenarios.content.map { ScenarioResponse.from(it) }
    }

    private fun createScenario(
        user: User,
        session: Session?,
        request: AnalyzeRequest
    ): Scenario {
        return Scenario(
            user = user,
            session = session,
            holeCards = request.holeCards,
            communityCards = request.communityCards,
            position = request.position,
            playerCount = request.playerCount,
            playerStack = request.playerStack,
            potSize = request.potSize,
            blinds = request.blinds,
            street = request.street,
            actionFacing = request.actionFacing
        )
    }
}

