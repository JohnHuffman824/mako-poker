package com.mako.service

import com.mako.dto.PlayerActionRequest
import com.mako.dto.StartGameRequest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.util.UUID

/**
 * Tests for proper minimum raise validation.
 * Enforces poker rule: minimum re-raise equals size of previous raise.
 */
@DisplayName("Raise Validation Tests")
class RaiseValidationTest {

    private lateinit var gameService: GameService
    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setup() {
        val aiPlayerService = AiPlayerService()
        val potManager = PotManager()
        val showdownService = ShowdownService()
        gameService = GameService(aiPlayerService, potManager, showdownService)
    }

    @Test
    @DisplayName("Initial raise must be at least 2x BB")
    fun testInitialRaiseMinimum() {
        val game = gameService.startGame(userId, StartGameRequest(
            playerCount = 3,
            startingStack = 100.0,
            smallBlind = 0.5,
            bigBlind = 1.0
        ))

        val dealt = gameService.dealHand(game.id)

        // Min raise preflop is 2x BB = 2.0
        // Trying to raise to 1.5 should fail
        assertThrows(IllegalArgumentException::class.java) {
            gameService.processAction(
                dealt.id,
                PlayerActionRequest(action = "raise", amount = 1.5)
            )
        }

        // Raising to 2.0 should succeed (raise of 1.0)
        val afterRaise = gameService.processAction(
            dealt.id,
            PlayerActionRequest(action = "raise", amount = 2.0)
        )

        assertEquals(1.0, afterRaise.minRaise,
            "After raising by 1.0, minRaise should be 1.0")
    }

    @Test
    @DisplayName("Re-raise must be at least size of previous raise")
    fun testReRaiseMinimum() {
        val game = gameService.startGame(userId, StartGameRequest(
            playerCount = 3,
            startingStack = 100.0,
            smallBlind = 1.0,
            bigBlind = 2.0
        ))

        val dealt = gameService.dealHand(game.id)

        // First raise from 2 to 8 (raise of 6)
        val afterFirstRaise = gameService.processAction(
            dealt.id,
            PlayerActionRequest(action = "raise", amount = 8.0)
        )

        assertEquals(6.0, afterFirstRaise.minRaise,
            "After raising 6, minRaise should be 6")

        // Try to re-raise by only 3 (to 11) - should fail
        // Minimum is 8 + 6 = 14
        assertThrows(IllegalArgumentException::class.java) {
            gameService.processAction(
                afterFirstRaise.id,
                PlayerActionRequest(action = "raise", amount = 11.0)
            )
        }

        // Re-raising to 14 (raise of 6) should succeed
        val afterReRaise = gameService.processAction(
            afterFirstRaise.id,
            PlayerActionRequest(action = "raise", amount = 14.0)
        )

        assertEquals(6.0, afterReRaise.minRaise,
            "After re-raising 6, minRaise should still be 6")
    }

    @Test
    @DisplayName("All-in for less than minimum raise is allowed")
    fun testAllInLessThanMinimum() {
        val game = gameService.startGame(userId, StartGameRequest(
            playerCount = 3,
            startingStack = 10.0,
            smallBlind = 1.0,
            bigBlind = 2.0
        ))

        val dealt = gameService.dealHand(game.id)

        // Raise from 2 to 8 (raise of 6, so minRaise = 6)
        val afterRaise = gameService.processAction(
            dealt.id,
            PlayerActionRequest(action = "raise", amount = 8.0)
        )

        // Player with only 3 chips left can go all-in for 11
        // Even though minRaise would require 14
        // This should succeed because it's an all-in
        val afterAllIn = gameService.processAction(
            afterRaise.id,
            PlayerActionRequest(action = "raise", amount = 11.0)
        )

        assertTrue(afterAllIn.players.any { it.isAllIn },
            "Player should be all-in")
    }

    @Test
    @DisplayName("Raise display text includes space between number and BB")
    fun testRaiseDisplayFormat() {
        val game = gameService.startGame(userId, StartGameRequest(
            playerCount = 3,
            startingStack = 100.0,
            smallBlind = 1.0,
            bigBlind = 2.0
        ))

        val dealt = gameService.dealHand(game.id)

        // Raise to 8 (raise of 6 = 3 BB)
        val afterRaise = gameService.processAction(
            dealt.id,
            PlayerActionRequest(action = "raise", amount = 8.0)
        )

        val raiser = afterRaise.players.find {
            it.lastAction?.startsWith("RAISE") == true
        }

        assertNotNull(raiser)
        assertTrue(raiser!!.lastAction!!.contains(" BB"),
            "Raise action should have space before BB: ${raiser.lastAction}")
    }

    @Test
    @DisplayName("Minimum raise after call is still previous raise size")
    fun testMinRaisePersistsAfterCall() {
        val game = gameService.startGame(userId, StartGameRequest(
            playerCount = 4,
            startingStack = 100.0,
            smallBlind = 1.0,
            bigBlind = 2.0
        ))

        val dealt = gameService.dealHand(game.id)

        // Player 1 raises to 8 (raise of 6)
        val afterRaise = gameService.processAction(
            dealt.id,
            PlayerActionRequest(action = "raise", amount = 8.0)
        )

        // Player 2 calls
        val afterCall = gameService.processAction(
            afterRaise.id,
            PlayerActionRequest(action = "call")
        )

        // Player 3 wants to re-raise - minRaise should still be 6
        assertEquals(6.0, afterCall.minRaise,
            "MinRaise should persist after a call")
    }
}

