package com.mako.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.Instant
import java.util.UUID

/**
 * User entity representing a registered user of the application.
 * Contains authentication credentials and profile information.
 */
@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(unique = true, nullable = false, length = 255)
    var email: String,

    @Column(name = "password_hash", nullable = false, length = 255)
    var passwordHash: String,

    @Column(name = "display_name", length = 100)
    var displayName: String? = null,

    @Column(nullable = false)
    var enabled: Boolean = true,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = [JoinColumn(name = "user_id")])
    @Column(name = "role")
    var roles: MutableSet<String> = mutableSetOf("ROLE_USER"),

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: Instant? = null,

    @UpdateTimestamp
    @Column(name = "updated_at")
    var updatedAt: Instant? = null,

    @Column(name = "last_login")
    var lastLogin: Instant? = null
)

