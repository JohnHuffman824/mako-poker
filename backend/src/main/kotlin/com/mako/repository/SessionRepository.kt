package com.mako.repository

import com.mako.model.Session
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Repository for Session entity operations.
 */
@Repository
interface SessionRepository : JpaRepository<Session, UUID> {

    fun findByUserId(userId: UUID, pageable: Pageable): Page<Session>

    fun findByUserIdOrderByStartedAtDesc(userId: UUID): List<Session>

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.endedAt IS NULL")
    fun findActiveSessionByUserId(userId: UUID): Optional<Session>

    @Query("""
        SELECT s FROM Session s 
        WHERE s.user.id = :userId 
        ORDER BY s.startedAt DESC 
        LIMIT 1
    """)
    fun findMostRecentByUserId(userId: UUID): Optional<Session>

    @Query("""
        SELECT AVG(s.gtoAdherence) FROM Session s 
        WHERE s.user.id = :userId AND s.endedAt IS NOT NULL
    """)
    fun calculateAverageGtoAdherence(userId: UUID): Double?

    @Query("""
        SELECT SUM(s.sessionPnl) FROM Session s 
        WHERE s.user.id = :userId
    """)
    fun calculateTotalPnl(userId: UUID): java.math.BigDecimal?
}

