package com.mako.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

/**
 * Health check endpoints for monitoring.
 */
@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Health check endpoints")
class HealthController {

    @GetMapping
    @Operation(summary = "Basic health check")
    fun health(): ResponseEntity<HealthResponse> {
        return ResponseEntity.ok(
            HealthResponse(
                status = "UP",
                timestamp = Instant.now().toString()
            )
        )
    }

    @GetMapping("/ready")
    @Operation(summary = "Readiness check")
    fun ready(): ResponseEntity<HealthResponse> {
        return ResponseEntity.ok(
            HealthResponse(
                status = "READY",
                timestamp = Instant.now().toString()
            )
        )
    }
}

data class HealthResponse(
    val status: String,
    val timestamp: String
)

