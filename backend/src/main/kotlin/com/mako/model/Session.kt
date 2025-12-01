package com.mako.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Poker session entity tracking a user's playing session.
 * Records aggregate statistics like hands played, P&L, and GTO adherence.
 */
@Entity
@Table(name = "sessions")
class Session(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "hands_played", nullable = false)
    var handsPlayed: Int = 0,

    @Column(name = "session_pnl", precision = 12, scale = 2)
    var sessionPnl: BigDecimal = BigDecimal.ZERO,

    @Column(name = "gto_adherence", precision = 5, scale = 2)
    var gtoAdherence: BigDecimal = BigDecimal.ZERO,

    @Column(name = "game_type", length = 50)
    var gameType: String = "NLHE",

    @Column(length = 50)
    var blinds: String? = null,

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    val startedAt: Instant? = null,

    @Column(name = "ended_at")
    var endedAt: Instant? = null,

    @OneToMany(mappedBy = "session", cascade = [CascadeType.ALL], orphanRemoval = true)
    val scenarios: MutableList<Scenario> = mutableListOf()
) {
    /**
     * Marks the session as ended with the current timestamp.
     */
    fun endSession() {
        this.endedAt = Instant.now()
    }

    /**
     * Checks if the session is currently active.
     */
    fun isActive(): Boolean = endedAt == null
}

