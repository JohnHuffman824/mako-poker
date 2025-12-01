package com.mako.dto

import com.mako.model.User
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for user information.
 */
data class UserResponse(
    val id: UUID,
    val email: String,
    val displayName: String?,
    val createdAt: Instant?,
    val lastLogin: Instant?
) {
    companion object {
        fun from(user: User): UserResponse = UserResponse(
            id = user.id!!,
            email = user.email,
            displayName = user.displayName,
            createdAt = user.createdAt,
            lastLogin = user.lastLogin
        )
    }
}

/**
 * Request DTO for updating user profile.
 */
data class UpdateUserRequest(
    val displayName: String? = null,
    val currentPassword: String? = null,
    val newPassword: String? = null
)

/**
 * Response DTO for user statistics.
 */
data class UserStatsResponse(
    val totalSessions: Long,
    val totalHandsPlayed: Long,
    val totalPnl: Double,
    val averageGtoAdherence: Double,
    val averageEquity: Double
)

