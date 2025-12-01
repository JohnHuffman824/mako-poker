package com.mako.service

import com.mako.dto.*
import com.mako.model.Session
import com.mako.repository.SessionRepository
import com.mako.repository.UserRepository
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing poker sessions.
 */
@Service
class SessionService(
    private val sessionRepository: SessionRepository,
    private val userRepository: UserRepository
) {

    /**
     * Gets paginated list of user sessions.
     */
    @Transactional(readOnly = true)
    fun getUserSessions(userId: UUID, pageable: Pageable): SessionListResponse {
        val page = sessionRepository.findByUserId(userId, pageable)
        
        return SessionListResponse(
            sessions = page.content.map { SessionResponse.from(it) },
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            currentPage = page.number
        )
    }

    /**
     * Gets or creates an active session for the user.
     */
    @Transactional
    fun getOrCreateActiveSession(userId: UUID): SessionResponse {
        val existingSession = sessionRepository.findActiveSessionByUserId(userId)
        
        if (existingSession.isPresent) {
            return SessionResponse.from(existingSession.get())
        }

        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val newSession = Session(user = user)
        val savedSession = sessionRepository.save(newSession)
        
        return SessionResponse.from(savedSession)
    }

    /**
     * Gets a specific session by ID.
     */
    @Transactional(readOnly = true)
    fun getSession(sessionId: UUID, userId: UUID): SessionResponse {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { IllegalArgumentException("Session not found") }

        if (session.user.id != userId) {
            throw IllegalArgumentException("Access denied")
        }

        return SessionResponse.from(session)
    }

    /**
     * Creates a new session.
     */
    @Transactional
    fun createSession(userId: UUID, request: CreateSessionRequest): SessionResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        // End any active session first
        sessionRepository.findActiveSessionByUserId(userId)
            .ifPresent { it.endSession(); sessionRepository.save(it) }

        val session = Session(
            user = user,
            gameType = request.gameType,
            blinds = request.blinds
        )

        val savedSession = sessionRepository.save(session)
        return SessionResponse.from(savedSession)
    }

    /**
     * Updates a session.
     */
    @Transactional
    fun updateSession(
        sessionId: UUID, 
        userId: UUID, 
        request: UpdateSessionRequest
    ): SessionResponse {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { IllegalArgumentException("Session not found") }

        if (session.user.id != userId) {
            throw IllegalArgumentException("Access denied")
        }

        request.handsPlayed?.let { session.handsPlayed = it }
        request.sessionPnl?.let { session.sessionPnl = it }
        request.gtoAdherence?.let { session.gtoAdherence = it }

        if (request.endSession) {
            session.endSession()
        }

        val updatedSession = sessionRepository.save(session)
        return SessionResponse.from(updatedSession)
    }

    /**
     * Ends a session.
     */
    @Transactional
    fun endSession(sessionId: UUID, userId: UUID) {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { IllegalArgumentException("Session not found") }

        if (session.user.id != userId) {
            throw IllegalArgumentException("Access denied")
        }

        session.endSession()
        sessionRepository.save(session)
    }
}

