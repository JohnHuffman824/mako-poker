package com.mako.repository

import com.mako.enums.PokerAction
import com.mako.model.Recommendation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Repository for Recommendation entity operations.
 */
@Repository
interface RecommendationRepository : JpaRepository<Recommendation, UUID> {

    fun findByScenarioId(scenarioId: UUID): List<Recommendation>

    @Query("""
        SELECT r FROM Recommendation r 
        WHERE r.scenario.id = :scenarioId 
        ORDER BY r.createdAt DESC 
        LIMIT 1
    """)
    fun findLatestByScenarioId(scenarioId: UUID): Recommendation?

    @Query("""
        SELECT r.recommendedAction, COUNT(r) FROM Recommendation r 
        WHERE r.scenario.user.id = :userId 
        GROUP BY r.recommendedAction
    """)
    fun countActionsByUserId(userId: UUID): List<Array<Any>>

    @Query("""
        SELECT AVG(r.equity) FROM Recommendation r 
        WHERE r.scenario.user.id = :userId
    """)
    fun calculateAverageEquity(userId: UUID): Double?
}

