import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as gameService from '../../services/game-service'
import type { GameState } from '@mako/shared'

/**
 * Comprehensive tests for player seat management.
 * Tests adding, removing players, and ensuring proper metadata.
 */
describe('PlayerManagement', () => {
  let game: GameState
  let userId: string

  beforeEach(() => {
    userId = `test-user-${Date.now()}`
    game = gameService.startGame(userId, {
      playerCount: 2,
      startingStack: 100,
      smallBlind: 0.5,
      bigBlind: 1
    })
  })

  afterEach(() => {
    try {
      gameService.endGame(game.id, userId)
    } catch {
      // Game may already be ended
    }
  })

  describe('addPlayerAtSeat', () => {
    it('adds a player with correct stack size matching existing players', () => {
      const result = gameService.addPlayerAtSeat(game.id, 5)

      expect(result.playerCount).toBe(3)
      const newPlayer = result.players.find(p => p.seatIndex === 5)
      expect(newPlayer).toBeDefined()
      expect(newPlayer!.stack).toBe(100)
    })

    it('adds player at the correct seat index', () => {
      const result = gameService.addPlayerAtSeat(game.id, 7)

      const newPlayer = result.players.find(p => p.seatIndex === 7)
      expect(newPlayer).toBeDefined()
      expect(newPlayer!.seatIndex).toBe(7)
    })

    it('new player has correct initial metadata', () => {
      const result = gameService.addPlayerAtSeat(game.id, 4)

      const newPlayer = result.players.find(p => p.seatIndex === 4)
      expect(newPlayer!.isHero).toBe(false)
      expect(newPlayer!.isFolded).toBe(false)
      expect(newPlayer!.isAllIn).toBe(false)
      expect(newPlayer!.currentBet).toBe(0)
      expect(newPlayer!.holeCards).toBeNull()
      expect(newPlayer!.lastAction).toBeNull()
    })

    it('players remain sorted by seat index after adding', () => {
      gameService.addPlayerAtSeat(game.id, 5)
      gameService.addPlayerAtSeat(game.id, 3)
      const result = gameService.addPlayerAtSeat(game.id, 7)

      for (let i = 1; i < result.players.length; i++) {
        expect(result.players[i].seatIndex).toBeGreaterThan(
          result.players[i - 1].seatIndex
        )
      }
    })

    it('assigns positions correctly after adding player', () => {
      const result = gameService.addPlayerAtSeat(game.id, 2)

      // With 3 players, should have BTN, SB, BB assigned
      const positions = result.players.map(p => p.position)
      expect(positions).toContain('BTN')
      expect(positions).toContain('SB')
      expect(positions).toContain('BB')
    })

    it('throws error when adding to occupied seat', () => {
      expect(() => gameService.addPlayerAtSeat(game.id, 0)).toThrow(
        'Seat 0 is already occupied'
      )
    })

    it('throws error when seat index is negative', () => {
      expect(() => gameService.addPlayerAtSeat(game.id, -1)).toThrow(
        'Seat index must be between 0 and 9'
      )
    })

    it('throws error when seat index exceeds 9', () => {
      expect(() => gameService.addPlayerAtSeat(game.id, 10)).toThrow(
        'Seat index must be between 0 and 9'
      )
    })

    it('throws error when table is full (10 players)', () => {
      // Start with 2 players, add 8 more
      for (let i = 2; i < 10; i++) {
        gameService.addPlayerAtSeat(game.id, i)
      }

      // Trying to add 11th player should fail
      expect(() => gameService.addPlayerAtSeat(game.id, 0)).toThrow()
    })

    it('throws error when hand is in progress', () => {
      gameService.dealHand(game.id)

      expect(() => gameService.addPlayerAtSeat(game.id, 5)).toThrow(
        'Cannot add player during hand'
      )
    })

    it('throws error for non-existent game', () => {
      expect(() => gameService.addPlayerAtSeat('fake-id', 5)).toThrow(
        'Game not found'
      )
    })
  })

  describe('removePlayerAtSeat', () => {
    beforeEach(() => {
      // Add extra players so we can remove some
      gameService.addPlayerAtSeat(game.id, 2)
      gameService.addPlayerAtSeat(game.id, 4)
    })

    it('removes player from correct seat', () => {
      const result = gameService.removePlayerAtSeat(game.id, 2)

      expect(result.playerCount).toBe(3)
      expect(result.players.find(p => p.seatIndex === 2)).toBeUndefined()
    })

    it('updates player count correctly', () => {
      const result = gameService.removePlayerAtSeat(game.id, 4)
      expect(result.playerCount).toBe(3)
    })

    it('reassigns positions after removal', () => {
      const result = gameService.removePlayerAtSeat(game.id, 2)

      // Should still have valid positions
      const positions = result.players.map(p => p.position)
      expect(positions).toContain('BTN')
      expect(positions).toContain('SB')
      expect(positions).toContain('BB')
    })

    it('throws error when removing hero player', () => {
      expect(() => gameService.removePlayerAtSeat(game.id, 0)).toThrow(
        'Cannot remove the hero player'
      )
    })

    it('throws error when removing non-existent seat', () => {
      expect(() => gameService.removePlayerAtSeat(game.id, 9)).toThrow(
        'No player at seat 9'
      )
    })

    it('throws error when would leave fewer than 2 players', () => {
      gameService.removePlayerAtSeat(game.id, 2)
      gameService.removePlayerAtSeat(game.id, 4)

      // Only hero and one AI left, cannot remove the AI
      expect(() => gameService.removePlayerAtSeat(game.id, 1)).toThrow(
        'Cannot have fewer than 2 players'
      )
    })

    it('throws error when hand is in progress', () => {
      gameService.dealHand(game.id)

      expect(() => gameService.removePlayerAtSeat(game.id, 2)).toThrow(
        'Cannot remove player during hand'
      )
    })
  })

  describe('updatePlayerCount', () => {
    it('adds players when increasing count', () => {
      const result = gameService.updatePlayerCount(game.id, 6)

      expect(result.playerCount).toBe(6)
      expect(result.players.length).toBe(6)
    })

    it('removes AI players when decreasing count', () => {
      gameService.updatePlayerCount(game.id, 6)
      const result = gameService.updatePlayerCount(game.id, 3)

      expect(result.playerCount).toBe(3)
      expect(result.players.length).toBe(3)
    })

    it('preserves hero player when decreasing count', () => {
      gameService.updatePlayerCount(game.id, 6)
      const result = gameService.updatePlayerCount(game.id, 2)

      const hero = result.players.find(p => p.isHero)
      expect(hero).toBeDefined()
      expect(hero!.seatIndex).toBe(0)
    })

    it('new players have correct stack matching others', () => {
      const result = gameService.updatePlayerCount(game.id, 5)

      for (const player of result.players) {
        expect(player.stack).toBe(100)
      }
    })

    it('throws error for count less than 2', () => {
      expect(() => gameService.updatePlayerCount(game.id, 1)).toThrow(
        'Player count must be between 2 and 10'
      )
    })

    it('throws error for count greater than 10', () => {
      expect(() => gameService.updatePlayerCount(game.id, 11)).toThrow(
        'Player count must be between 2 and 10'
      )
    })

    it('throws error when hand is in progress', () => {
      gameService.dealHand(game.id)

      expect(() => gameService.updatePlayerCount(game.id, 4)).toThrow(
        'Cannot change player count during hand'
      )
    })
  })

  describe('updateBlinds', () => {
    it('updates blind sizes correctly', () => {
      const result = gameService.updateBlinds(game.id, 1, 2)

      expect(result.blinds.small).toBe(1)
      expect(result.blinds.big).toBe(2)
    })

    it('throws error for zero small blind', () => {
      expect(() => gameService.updateBlinds(game.id, 0, 2)).toThrow(
        'Blinds must be positive'
      )
    })

    it('throws error for negative big blind', () => {
      expect(() => gameService.updateBlinds(game.id, 1, -2)).toThrow(
        'Blinds must be positive'
      )
    })

    it('throws error when hand is in progress', () => {
      gameService.dealHand(game.id)

      expect(() => gameService.updateBlinds(game.id, 1, 2)).toThrow(
        'Cannot change blinds during hand'
      )
    })
  })
})

