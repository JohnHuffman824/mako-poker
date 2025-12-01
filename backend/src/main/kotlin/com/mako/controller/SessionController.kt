package com.mako.controller

import com.mako.dto.*
import com.mako.security.UserPrincipal
import com.mako.service.SessionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for poker session management.
 */
@RestController
@RequestMapping("/sessions")
@Tag(name = "Sessions", description = "Poker session management")
class SessionController(
    private val sessionService: SessionService
) {

    @GetMapping
    @Operation(summary = "Get all sessions for current user")
    fun getSessions(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<SessionListResponse> {
        val pageable = PageRequest.of(page, size)
        val response = sessionService.getUserSessions(user.id, pageable)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/current")
    @Operation(summary = "Get current active session or create one")
    fun getCurrentSession(
        @AuthenticationPrincipal user: UserPrincipal
    ): ResponseEntity<SessionResponse> {
        val response = sessionService.getOrCreateActiveSession(user.id)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session by ID")
    fun getSession(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable id: UUID
    ): ResponseEntity<SessionResponse> {
        val response = sessionService.getSession(id, user.id)
        return ResponseEntity.ok(response)
    }

    @PostMapping
    @Operation(summary = "Create a new session")
    fun createSession(
        @AuthenticationPrincipal user: UserPrincipal,
        @Valid @RequestBody request: CreateSessionRequest
    ): ResponseEntity<SessionResponse> {
        val response = sessionService.createSession(user.id, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update session")
    fun updateSession(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSessionRequest
    ): ResponseEntity<SessionResponse> {
        val response = sessionService.updateSession(id, user.id, request)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "End/delete session")
    fun deleteSession(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable id: UUID
    ): ResponseEntity<Void> {
        sessionService.endSession(id, user.id)
        return ResponseEntity.noContent().build()
    }
}

