package com.mako.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

/**
 * Cache entry for pre-computed solver results.
 * Stores CFR strategy outputs for quick lookup of common situations.
 */
@Entity
@Table(
    name = "solver_cache",
    indexes = [Index(name = "idx_solver_cache_hash", columnList = "situation_hash", unique = true)]
)
class SolverCache(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "situation_hash", nullable = false, unique = true, length = 64)
    val situationHash: String,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "strategy_data", nullable = false, columnDefinition = "jsonb")
    val strategyData: Map<String, Any>,

    @Column(nullable = false)
    val iterations: Int,

    @Column(name = "abstraction_level", length = 20)
    val abstractionLevel: String? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "accessed_at")
    var accessedAt: Instant = Instant.now(),

    @Column(name = "access_count")
    var accessCount: Long = 0
) {
    /**
     * Records an access to this cache entry.
     */
    fun recordAccess() {
        this.accessedAt = Instant.now()
        this.accessCount++
    }
}

