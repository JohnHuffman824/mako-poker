package com.mako.security

import io.jsonwebtoken.*
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey

/**
 * Utility class for JWT token generation and validation.
 */
@Component
class JwtTokenProvider(
    @Value("\${jwt.secret}")
    private val jwtSecret: String,

    @Value("\${jwt.expiration-ms}")
    private val jwtExpirationMs: Long,

    @Value("\${jwt.refresh-expiration-ms}")
    private val refreshExpirationMs: Long
) {
    private val logger = LoggerFactory.getLogger(JwtTokenProvider::class.java)

    private val key: SecretKey by lazy {
        val keyBytes = Decoders.BASE64.decode(jwtSecret)
        Keys.hmacShaKeyFor(keyBytes)
    }

    /**
     * Generates an access token for the authenticated user.
     */
    fun generateAccessToken(authentication: Authentication): String {
        val userPrincipal = authentication.principal as UserPrincipal
        return generateToken(userPrincipal.id.toString(), jwtExpirationMs, "access")
    }

    /**
     * Generates an access token from user ID.
     */
    fun generateAccessToken(userId: UUID): String {
        return generateToken(userId.toString(), jwtExpirationMs, "access")
    }

    /**
     * Generates a refresh token for the user.
     */
    fun generateRefreshToken(userId: UUID): String {
        return generateToken(userId.toString(), refreshExpirationMs, "refresh")
    }

    private fun generateToken(subject: String, expirationMs: Long, type: String): String {
        val now = Date()
        val expiryDate = Date(now.time + expirationMs)

        return Jwts.builder()
            .subject(subject)
            .claim("type", type)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact()
    }

    /**
     * Extracts user ID from the JWT token.
     */
    fun getUserIdFromToken(token: String): UUID {
        val claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload

        return UUID.fromString(claims.subject)
    }

    /**
     * Validates the JWT token.
     */
    fun validateToken(token: String): Boolean {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
            return true
        } catch (ex: SecurityException) {
            logger.error("Invalid JWT signature")
        } catch (ex: MalformedJwtException) {
            logger.error("Invalid JWT token")
        } catch (ex: ExpiredJwtException) {
            logger.error("Expired JWT token")
        } catch (ex: UnsupportedJwtException) {
            logger.error("Unsupported JWT token")
        } catch (ex: IllegalArgumentException) {
            logger.error("JWT claims string is empty")
        }
        return false
    }

    /**
     * Checks if the token is a refresh token.
     */
    fun isRefreshToken(token: String): Boolean {
        return try {
            val claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .payload
            claims["type"] == "refresh"
        } catch (ex: Exception) {
            false
        }
    }

    /**
     * Returns the expiration time in seconds.
     */
    fun getExpirationInSeconds(): Long = jwtExpirationMs / 1000
}

