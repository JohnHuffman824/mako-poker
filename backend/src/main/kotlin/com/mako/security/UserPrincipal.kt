package com.mako.security

import com.mako.model.User
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.UUID

/**
 * Custom UserDetails implementation wrapping our User entity.
 */
class UserPrincipal(
    val id: UUID,
    val email: String,
    private val passwordHash: String,
    private val authorities: Collection<GrantedAuthority>,
    private val enabled: Boolean
) : UserDetails {

    override fun getAuthorities(): Collection<GrantedAuthority> = authorities

    override fun getPassword(): String = passwordHash

    override fun getUsername(): String = email

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = true

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = enabled

    companion object {
        /**
         * Creates a UserPrincipal from a User entity.
         */
        fun from(user: User): UserPrincipal {
            val authorities = user.roles.map { SimpleGrantedAuthority(it) }

            return UserPrincipal(
                id = user.id!!,
                email = user.email,
                passwordHash = user.passwordHash,
                authorities = authorities,
                enabled = user.enabled
            )
        }
    }
}

