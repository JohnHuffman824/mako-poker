package com.mako.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * GTO recommendation for a specific scenario.
 * Contains the solver output including action frequencies and EV calculations.
 */
@Entity
@Table(name = "recommendations")
class Recommendation(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false)
    val scenario: Scenario,

    @Column(name = "recommended_action", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    val recommendedAction: PokerAction,

    @Column(name = "action_confidence", nullable = false, precision = 5, scale = 2)
    val actionConfidence: BigDecimal,

    @Column(name = "fold_pct", precision = 5, scale = 2)
    val foldPct: BigDecimal = BigDecimal.ZERO,

    @Column(name = "call_pct", precision = 5, scale = 2)
    val callPct: BigDecimal = BigDecimal.ZERO,

    @Column(name = "raise_pct", precision = 5, scale = 2)
    val raisePct: BigDecimal = BigDecimal.ZERO,

    @Column(name = "recommended_bet_size", precision = 12, scale = 2)
    val recommendedBetSize: BigDecimal? = null,

    @Column(nullable = false, precision = 5, scale = 4)
    val equity: BigDecimal,

    @Column(name = "expected_value", precision = 12, scale = 4)
    val expectedValue: BigDecimal? = null,

    @Column(name = "pot_odds", length = 20)
    val potOdds: String? = null,

    @Column(name = "calculation_time_ms")
    val calculationTimeMs: Int? = null,

    @Column(name = "solver_iterations")
    val solverIterations: Int? = null,

    @Column(name = "solver_depth")
    val solverDepth: Int? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: Instant? = null
)

/**
 * Possible poker actions.
 */
enum class PokerAction {
    FOLD,
    CHECK,
    CALL,
    BET,
    RAISE,
    ALL_IN
}

