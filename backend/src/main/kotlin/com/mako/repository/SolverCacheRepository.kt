package com.mako.repository

import com.mako.model.SolverCache
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository for SolverCache entity operations.
 */
@Repository
interface SolverCacheRepository : JpaRepository<SolverCache, UUID> {

    fun findBySituationHash(situationHash: String): Optional<SolverCache>

    fun existsBySituationHash(situationHash: String): Boolean

    @Modifying
    @Query("""
        UPDATE SolverCache s 
        SET s.accessedAt = :timestamp, s.accessCount = s.accessCount + 1 
        WHERE s.situationHash = :hash
    """)
    fun recordAccess(hash: String, timestamp: Instant)

    @Modifying
    @Query("DELETE FROM SolverCache s WHERE s.accessedAt < :cutoff")
    fun deleteOlderThan(cutoff: Instant): Int

    @Query("SELECT COUNT(s) FROM SolverCache s")
    fun getCacheSize(): Long

    @Query("""
        SELECT s FROM SolverCache s 
        ORDER BY s.accessCount DESC 
        LIMIT :limit
    """)
    fun findMostAccessed(limit: Int): List<SolverCache>
}

