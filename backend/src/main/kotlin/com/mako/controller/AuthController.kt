package com.mako.controller

import com.mako.dto.*
import com.mako.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "User authentication and registration")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    fun register(
        @Valid @RequestBody request: RegisterRequest
    ): ResponseEntity<AuthResponse> {
        val response = authService.register(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get tokens")
    fun login(
        @Valid @RequestBody request: LoginRequest
    ): ResponseEntity<AuthResponse> {
        val response = authService.login(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    fun refreshToken(
        @Valid @RequestBody request: RefreshTokenRequest
    ): ResponseEntity<TokenRefreshResponse> {
        val response = authService.refreshToken(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user (client-side token invalidation)")
    fun logout(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("message" to "Logged out successfully"))
    }
}

