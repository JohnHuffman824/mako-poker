package com.mako.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Represents a specific poker scenario/hand for GTO analysis.
 * Captures all relevant game state information at a decision point.
 */
@Entity
@Table(name = "scenarios")
class Scenario(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    val session: Session? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "hole_cards", nullable = false, length = 10)
    val holeCards: String,

    @Column(name = "community_cards", length = 25)
    val communityCards: String? = null,

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    val position: Position,

    @Column(name = "player_count", nullable = false)
    val playerCount: Int,

    @Column(name = "player_stack", nullable = false, precision = 12, scale = 2)
    val playerStack: BigDecimal,

    @Column(name = "pot_size", nullable = false, precision = 12, scale = 2)
    val potSize: BigDecimal,

    @Column(nullable = false, length = 20)
    val blinds: String,

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    val street: Street = Street.PREFLOP,

    @Column(name = "effective_stack", precision = 12, scale = 2)
    val effectiveStack: BigDecimal? = null,

    @Column(name = "action_facing", length = 20)
    val actionFacing: String? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: Instant? = null,

    @OneToMany(mappedBy = "scenario", cascade = [CascadeType.ALL], orphanRemoval = true)
    val recommendations: MutableList<Recommendation> = mutableListOf()
)

/**
 * Player positions at the poker table.
 */
enum class Position {
    UTG,      // Under the Gun (first to act preflop)
    UTG_1,    // UTG+1
    MP,       // Middle Position
    MP_1,     // Middle Position +1
    CO,       // Cutoff
    BTN,      // Button (dealer)
    SB,       // Small Blind
    BB        // Big Blind
}

/**
 * Betting streets in Hold'em.
 */
enum class Street {
    PREFLOP,
    FLOP,
    TURN,
    RIVER
}

