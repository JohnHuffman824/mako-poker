package com.mako.repository

import com.mako.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository for User entity operations.
 */
@Repository
interface UserRepository : JpaRepository<User, UUID> {

    fun findByEmail(email: String): Optional<User>

    fun existsByEmail(email: String): Boolean

    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :timestamp WHERE u.id = :userId")
    fun updateLastLogin(userId: UUID, timestamp: Instant)

    @Query("SELECT u FROM User u WHERE u.enabled = true")
    fun findAllEnabled(): List<User>
}

