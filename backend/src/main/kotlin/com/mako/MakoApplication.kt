package com.mako

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/**
 * Main entry point for the Mako Poker Backend application.
 * 
 * This Spring Boot application provides:
 * - REST API for poker game management
 * - Real-time poker gameplay with AI opponents
 * - User authentication and session management
 * - WebSocket support for real-time updates
 */
@SpringBootApplication
class MakoApplication

fun main(args: Array<String>) {
    runApplication<MakoApplication>(*args)
}

