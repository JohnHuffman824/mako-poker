package com.mako.repository

import com.mako.model.Scenario
import com.mako.model.Street
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Repository for Scenario entity operations.
 */
@Repository
interface ScenarioRepository : JpaRepository<Scenario, UUID> {

    fun findBySessionId(sessionId: UUID, pageable: Pageable): Page<Scenario>

    fun findByUserId(userId: UUID, pageable: Pageable): Page<Scenario>

    @Query("""
        SELECT s FROM Scenario s 
        WHERE s.user.id = :userId 
        ORDER BY s.createdAt DESC
    """)
    fun findRecentByUserId(userId: UUID, pageable: Pageable): Page<Scenario>

    @Query("""
        SELECT s FROM Scenario s 
        WHERE s.holeCards = :holeCards 
        AND s.street = :street 
        AND s.position = :position
    """)
    fun findSimilarScenarios(
        holeCards: String,
        street: Street,
        position: com.mako.model.Position
    ): List<Scenario>

    @Query("""
        SELECT COUNT(s) FROM Scenario s 
        WHERE s.session.id = :sessionId
    """)
    fun countBySessionId(sessionId: UUID): Long
}

