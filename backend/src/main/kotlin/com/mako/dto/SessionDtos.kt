package com.mako.dto

import com.mako.model.Session
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Request DTO for creating a new session.
 */
data class CreateSessionRequest(
    val gameType: String = "NLHE",
    val blinds: String? = null
)

/**
 * Request DTO for updating a session.
 */
data class UpdateSessionRequest(
    val handsPlayed: Int? = null,
    val sessionPnl: BigDecimal? = null,
    val gtoAdherence: BigDecimal? = null,
    val endSession: Boolean = false
)

/**
 * Response DTO for session information.
 */
data class SessionResponse(
    val id: UUID,
    val handsPlayed: Int,
    val sessionPnl: BigDecimal,
    val gtoAdherence: BigDecimal,
    val gameType: String,
    val blinds: String?,
    val startedAt: Instant?,
    val endedAt: Instant?,
    val isActive: Boolean
) {
    companion object {
        fun from(session: Session): SessionResponse = SessionResponse(
            id = session.id!!,
            handsPlayed = session.handsPlayed,
            sessionPnl = session.sessionPnl,
            gtoAdherence = session.gtoAdherence,
            gameType = session.gameType,
            blinds = session.blinds,
            startedAt = session.startedAt,
            endedAt = session.endedAt,
            isActive = session.isActive()
        )
    }
}

/**
 * Response DTO for paginated session list.
 */
data class SessionListResponse(
    val sessions: List<SessionResponse>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int
)

