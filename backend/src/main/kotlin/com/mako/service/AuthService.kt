package com.mako.service

import com.mako.dto.*
import com.mako.model.User
import com.mako.repository.UserRepository
import com.mako.security.JwtTokenProvider
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * Service for authentication operations.
 */
@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val authenticationManager: AuthenticationManager
) {

    /**
     * Registers a new user.
     */
    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("Email already registered")
        }

        val user = User(
            email = request.email,
            passwordHash = passwordEncoder.encode(request.password),
            displayName = request.displayName
        )

        val savedUser = userRepository.save(user)

        val accessToken = jwtTokenProvider.generateAccessToken(savedUser.id!!)
        val refreshToken = jwtTokenProvider.generateRefreshToken(savedUser.id!!)

        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtTokenProvider.getExpirationInSeconds(),
            user = UserResponse.from(savedUser)
        )
    }

    /**
     * Authenticates a user and returns tokens.
     */
    @Transactional
    fun login(request: LoginRequest): AuthResponse {
        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(request.email, request.password)
        )

        val user = userRepository.findByEmail(request.email)
            .orElseThrow { IllegalArgumentException("User not found") }

        userRepository.updateLastLogin(user.id!!, Instant.now())

        val accessToken = jwtTokenProvider.generateAccessToken(authentication)
        val refreshToken = jwtTokenProvider.generateRefreshToken(user.id!!)

        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtTokenProvider.getExpirationInSeconds(),
            user = UserResponse.from(user)
        )
    }

    /**
     * Refreshes an access token using a refresh token.
     */
    fun refreshToken(request: RefreshTokenRequest): TokenRefreshResponse {
        val token = request.refreshToken

        if (!jwtTokenProvider.validateToken(token)) {
            throw IllegalArgumentException("Invalid refresh token")
        }

        if (!jwtTokenProvider.isRefreshToken(token)) {
            throw IllegalArgumentException("Token is not a refresh token")
        }

        val userId = jwtTokenProvider.getUserIdFromToken(token)
        val newAccessToken = jwtTokenProvider.generateAccessToken(userId)

        return TokenRefreshResponse(
            accessToken = newAccessToken,
            expiresIn = jwtTokenProvider.getExpirationInSeconds()
        )
    }
}

