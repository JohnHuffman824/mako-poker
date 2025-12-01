package com.mako.controller

import com.mako.dto.*
import com.mako.security.UserPrincipal
import com.mako.service.GameService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for poker game management.
 * Handles game creation, hand dealing, and player actions.
 */
@RestController
@RequestMapping("/game")
@Tag(name = "Game", description = "Poker game management")
class GameController(
    private val gameService: GameService
) {

    @PostMapping("/start")
    @Operation(summary = "Start a new poker game")
    fun startGame(
        @AuthenticationPrincipal user: UserPrincipal,
        @Valid @RequestBody request: StartGameRequest
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.startGame(user.id, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get current game state")
    fun getGame(
        @PathVariable id: UUID
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.getGame(id)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/current")
    @Operation(summary = "Get user's current game")
    fun getCurrentGame(
        @AuthenticationPrincipal user: UserPrincipal
    ): ResponseEntity<GameStateResponse?> {
        val response = gameService.getUserGame(user.id)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/{id}/deal")
    @Operation(summary = "Deal a new hand")
    fun dealHand(
        @PathVariable id: UUID
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.dealHand(id)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/{id}/action")
    @Operation(summary = "Submit player action")
    fun submitAction(
        @PathVariable id: UUID,
        @Valid @RequestBody request: PlayerActionRequest
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.processAction(id, request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/{id}/ai-action")
    @Operation(summary = "Process AI player action")
    fun processAiAction(
        @PathVariable id: UUID
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.processAiAction(id)
        return ResponseEntity.ok(response)
    }

    @PatchMapping("/{id}/players")
    @Operation(summary = "Update player count")
    fun updatePlayerCount(
        @PathVariable id: UUID,
        @RequestParam count: Int
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.updatePlayerCount(id, count)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/{id}/seat/{seatIndex}")
    @Operation(summary = "Add player to specific seat")
    fun addPlayerAtSeat(
        @PathVariable id: UUID,
        @PathVariable seatIndex: Int
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.addPlayerAtSeat(id, seatIndex)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @DeleteMapping("/{id}/seat/{seatIndex}")
    @Operation(summary = "Remove player from specific seat")
    fun removePlayerAtSeat(
        @PathVariable id: UUID,
        @PathVariable seatIndex: Int
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.removePlayerAtSeat(id, seatIndex)
        return ResponseEntity.ok(response)
    }

    @PatchMapping("/{id}/blinds")
    @Operation(summary = "Update blind sizes")
    fun updateBlinds(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateBlindsRequest
    ): ResponseEntity<GameStateResponse> {
        val response = gameService.updateBlinds(id, request.smallBlind, request.bigBlind)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "End the game")
    fun endGame(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable id: UUID
    ): ResponseEntity<Void> {
        gameService.endGame(id, user.id)
        return ResponseEntity.noContent().build()
    }
}

