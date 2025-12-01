package com.mako.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.util.StringUtils
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Filter that validates JWT tokens on incoming requests.
 */
@Component
class JwtAuthenticationFilter(
    private val tokenProvider: JwtTokenProvider,
    private val userDetailsService: CustomUserDetailsService
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val jwt = getJwtFromRequest(request)

            if (jwt != null && tokenProvider.validateToken(jwt)) {
                val userId = tokenProvider.getUserIdFromToken(jwt)
                val userDetails = userDetailsService.loadUserById(userId)

                val authentication = UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.authorities
                )
                authentication.details = 
                    WebAuthenticationDetailsSource().buildDetails(request)

                SecurityContextHolder.getContext().authentication = authentication
            }
        } catch (ex: Exception) {
            log.error("Could not set user authentication in security context", ex)
        }

        filterChain.doFilter(request, response)
    }

    /**
     * Extracts JWT from the Authorization header.
     */
    private fun getJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7)
        }
        return null
    }
}

