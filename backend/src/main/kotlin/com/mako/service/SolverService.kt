package com.mako.service

import com.mako.dto.AnalyzeRequest
import com.mako.dto.AnalysisResponse
import com.mako.dto.RecommendationResponse
import com.mako.dto.ScenarioResponse
import com.mako.model.*
import com.mako.repository.SolverCacheRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.security.MessageDigest

/**
 * Service that handles GTO solving logic.
 * Currently implements heuristic-based solving; will be enhanced with CFR.
 */
@Service
class SolverService(
    private val solverCacheRepository: SolverCacheRepository,
    @Value("\${solver.default-iterations:10000}")
    private val defaultIterations: Int
) {
    private val logger = LoggerFactory.getLogger(SolverService::class.java)

    /**
     * Solves a scenario using the configured solver.
     * This is a placeholder that uses heuristics - will be replaced with CFR.
     */
    fun solve(scenario: Scenario, request: AnalyzeRequest): Recommendation {
        val startTime = System.currentTimeMillis()

        // Calculate equity using Monte Carlo simulation
        val equity = calculateEquity(
            scenario.holeCards,
            scenario.communityCards,
            scenario.playerCount
        )

        // Determine action based on equity and position
        val (action, confidence, foldPct, callPct, raisePct) = determineAction(
            equity,
            scenario.position,
            scenario.street,
            scenario.potSize,
            scenario.playerStack
        )

        // Calculate pot odds
        val potOdds = calculatePotOdds(scenario.potSize)

        // Calculate expected value
        val ev = calculateExpectedValue(equity, scenario.potSize)

        // Calculate recommended bet size
        val betSize = if (action == PokerAction.RAISE || action == PokerAction.BET) {
            scenario.potSize.multiply(BigDecimal("0.66"))
        } else null

        val calculationTime = (System.currentTimeMillis() - startTime).toInt()

        return Recommendation(
            scenario = scenario,
            recommendedAction = action,
            actionConfidence = confidence,
            foldPct = foldPct,
            callPct = callPct,
            raisePct = raisePct,
            recommendedBetSize = betSize,
            equity = equity,
            expectedValue = ev,
            potOdds = potOdds,
            calculationTimeMs = calculationTime,
            solverIterations = defaultIterations
        )
    }

    /**
     * Quick solve using heuristics only (no database persistence).
     */
    fun quickSolve(request: AnalyzeRequest): AnalysisResponse {
        val startTime = System.currentTimeMillis()

        val equity = calculateEquity(
            request.holeCards,
            request.communityCards,
            request.playerCount
        )

        val (action, confidence, foldPct, callPct, raisePct) = determineAction(
            equity,
            request.position,
            request.street,
            request.potSize,
            request.playerStack
        )

        val potOdds = calculatePotOdds(request.potSize)
        val ev = calculateExpectedValue(equity, request.potSize)
        val betSize = if (action == PokerAction.RAISE || action == PokerAction.BET) {
            request.potSize.multiply(BigDecimal("0.66"))
        } else null

        val calculationTime = (System.currentTimeMillis() - startTime).toInt()

        // Create response without persisting
        val scenarioResponse = ScenarioResponse(
            id = java.util.UUID.randomUUID(),
            holeCards = request.holeCards,
            communityCards = request.communityCards,
            position = request.position,
            playerCount = request.playerCount,
            playerStack = request.playerStack,
            potSize = request.potSize,
            blinds = request.blinds,
            street = request.street,
            actionFacing = request.actionFacing,
            createdAt = java.time.Instant.now()
        )

        val recommendationResponse = RecommendationResponse(
            id = java.util.UUID.randomUUID(),
            scenarioId = scenarioResponse.id,
            recommendedAction = action,
            actionConfidence = confidence,
            foldPct = foldPct,
            callPct = callPct,
            raisePct = raisePct,
            recommendedBetSize = betSize,
            equity = equity,
            expectedValue = ev,
            potOdds = potOdds,
            calculationTimeMs = calculationTime,
            solverIterations = defaultIterations,
            createdAt = java.time.Instant.now()
        )

        return AnalysisResponse(
            scenario = scenarioResponse,
            recommendation = recommendationResponse,
            cached = false
        )
    }

    /**
     * Checks cache for existing solution.
     */
    fun getCachedResult(request: AnalyzeRequest): AnalysisResponse? {
        val hash = generateSituationHash(request)
        val cached = solverCacheRepository.findBySituationHash(hash)

        if (cached.isPresent) {
            cached.get().recordAccess()
            solverCacheRepository.save(cached.get())
            // Convert cached data to response - simplified for now
            logger.debug("Cache hit for situation: $hash")
        }

        return null // Full implementation pending
    }

    /**
     * Generates a hash for the game situation for caching.
     */
    private fun generateSituationHash(request: AnalyzeRequest): String {
        val situationString = buildString {
            append(request.holeCards)
            append("|")
            append(request.communityCards ?: "")
            append("|")
            append(request.position)
            append("|")
            append(request.playerCount)
            append("|")
            append(request.street)
        }

        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(situationString.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    /**
     * Monte Carlo equity calculation (simplified).
     * Will be replaced with proper implementation.
     */
    private fun calculateEquity(
        holeCards: String,
        communityCards: String?,
        playerCount: Int
    ): BigDecimal {
        // Simplified equity calculation based on hand strength
        val handStrength = evaluateHandStrength(holeCards, communityCards)

        // Adjust for number of opponents
        val adjustedEquity = handStrength / playerCount.toDouble()

        return BigDecimal(adjustedEquity).setScale(4, java.math.RoundingMode.HALF_UP)
    }

    /**
     * Simple hand strength evaluation.
     */
    private fun evaluateHandStrength(holeCards: String, communityCards: String?): Double {
        // Parse hole cards
        val card1Rank = holeCards[0]
        val card2Rank = holeCards[2]

        // Base strength from high cards
        var strength = (rankValue(card1Rank) + rankValue(card2Rank)) / 28.0

        // Bonus for pairs
        if (card1Rank == card2Rank) {
            strength += 0.3
        }

        // Bonus for suited
        val card1Suit = holeCards[1]
        val card2Suit = holeCards[3]
        if (card1Suit == card2Suit) {
            strength += 0.05
        }

        // Bonus for connectedness
        val gap = kotlin.math.abs(rankValue(card1Rank) - rankValue(card2Rank))
        if (gap <= 2) {
            strength += 0.05
        }

        // Community card evaluation (simplified)
        communityCards?.let {
            // Add bonus for made hands
            if (hasPair(holeCards, it)) strength += 0.15
            if (hasFlushDraw(holeCards, it)) strength += 0.10
        }

        return strength.coerceIn(0.0, 1.0)
    }

    private fun rankValue(rank: Char): Int = when (rank) {
        'A' -> 14
        'K' -> 13
        'Q' -> 12
        'J' -> 11
        'T' -> 10
        else -> rank.digitToInt()
    }

    private fun hasPair(holeCards: String, communityCards: String): Boolean {
        val holeRanks = listOf(holeCards[0], holeCards[2])
        val boardRanks = communityCards.chunked(2).map { it[0] }
        return holeRanks.any { it in boardRanks }
    }

    private fun hasFlushDraw(holeCards: String, communityCards: String): Boolean {
        val allSuits = listOf(holeCards[1], holeCards[3]) + 
            communityCards.chunked(2).map { it[1] }
        return allSuits.groupBy { it }.any { it.value.size >= 4 }
    }

    /**
     * Determines the recommended action based on equity and context.
     */
    private fun determineAction(
        equity: BigDecimal,
        position: Position,
        street: Street,
        potSize: BigDecimal,
        stack: BigDecimal
    ): ActionDecision {
        val equityDouble = equity.toDouble()

        // Position adjustment
        val positionBonus = when (position) {
            Position.BTN, Position.CO -> 0.05
            Position.SB, Position.BB -> -0.03
            else -> 0.0
        }

        val adjustedEquity = equityDouble + positionBonus

        return when {
            adjustedEquity >= 0.65 -> ActionDecision(
                PokerAction.RAISE,
                BigDecimal("85"),
                BigDecimal("5"),
                BigDecimal("20"),
                BigDecimal("75")
            )
            adjustedEquity >= 0.45 -> ActionDecision(
                PokerAction.CALL,
                BigDecimal("70"),
                BigDecimal("15"),
                BigDecimal("60"),
                BigDecimal("25")
            )
            adjustedEquity >= 0.30 -> ActionDecision(
                PokerAction.CALL,
                BigDecimal("55"),
                BigDecimal("35"),
                BigDecimal("50"),
                BigDecimal("15")
            )
            else -> ActionDecision(
                PokerAction.FOLD,
                BigDecimal("65"),
                BigDecimal("75"),
                BigDecimal("20"),
                BigDecimal("5")
            )
        }
    }

    private fun calculatePotOdds(potSize: BigDecimal): String {
        val betSize = potSize.multiply(BigDecimal("0.66"))
        val totalPot = potSize.add(betSize)
        val odds = totalPot.divide(betSize, 1, java.math.RoundingMode.HALF_UP)
        return "$odds:1"
    }

    private fun calculateExpectedValue(
        equity: BigDecimal, 
        potSize: BigDecimal
    ): BigDecimal {
        return equity.multiply(potSize)
            .subtract(BigDecimal.ONE.subtract(equity).multiply(potSize))
            .setScale(2, java.math.RoundingMode.HALF_UP)
    }

    /**
     * Data class for action decision results.
     */
    private data class ActionDecision(
        val action: PokerAction,
        val confidence: BigDecimal,
        val foldPct: BigDecimal,
        val callPct: BigDecimal,
        val raisePct: BigDecimal
    )
}

