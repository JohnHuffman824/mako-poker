package com.mako.security

import com.mako.repository.UserRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Custom UserDetailsService implementation for Spring Security.
 */
@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    /**
     * Loads user by email (username).
     */
    @Transactional(readOnly = true)
    override fun loadUserByUsername(email: String): UserDetails {
        val user = userRepository.findByEmail(email)
            .orElseThrow { 
                UsernameNotFoundException("User not found with email: $email") 
            }

        return UserPrincipal.from(user)
    }

    /**
     * Loads user by ID for JWT authentication.
     */
    @Transactional(readOnly = true)
    fun loadUserById(id: UUID): UserDetails {
        val user = userRepository.findById(id)
            .orElseThrow { 
                UsernameNotFoundException("User not found with id: $id") 
            }

        return UserPrincipal.from(user)
    }
}

