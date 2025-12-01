package com.mako.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Request DTO for user registration.
 */
data class RegisterRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,

    @field:Size(max = 100, message = "Display name must be at most 100 characters")
    val displayName: String? = null
)

/**
 * Request DTO for user login.
 */
data class LoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    val password: String
)

/**
 * Response DTO containing JWT tokens.
 */
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
)

/**
 * Request DTO for refreshing access token.
 */
data class RefreshTokenRequest(
    @field:NotBlank(message = "Refresh token is required")
    val refreshToken: String
)

/**
 * Response DTO for token refresh.
 */
data class TokenRefreshResponse(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long
)

