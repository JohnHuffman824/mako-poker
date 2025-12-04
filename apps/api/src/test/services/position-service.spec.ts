import { describe, it, expect } from 'bun:test'
import {
  findNextOccupiedSeat,
  assignPositions,
  getSmallBlindSeatIndex,
  getBigBlindSeatIndex,
  buildActionOrderSeats
} from '../../services/position-service'
import { createTestPlayer } from '../helpers'

describe('PositionService', () => {
  describe('findNextOccupiedSeat', () => {
    it('finds the next occupied seat clockwise', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 3 }),
        createTestPlayer({ seatIndex: 5 })
      ]

      expect(findNextOccupiedSeat(players, 0)).toBe(3)
      expect(findNextOccupiedSeat(players, 3)).toBe(5)
      expect(findNextOccupiedSeat(players, 5)).toBe(0)
    })

    it('returns null when no players', () => {
      expect(findNextOccupiedSeat([], 0)).toBe(null)
    })
  })

  describe('assignPositions', () => {
    it('assigns BTN, SB, BB for 3 players', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 1 }),
        createTestPlayer({ seatIndex: 2 })
      ]

      assignPositions(players, 0, 3)

      // Player at seat 0 should be BTN (closest to dealer)
      expect(players.find(p => p.seatIndex === 0)?.position).toBe('BTN')
      expect(players.find(p => p.seatIndex === 1)?.position).toBe('SB')
      expect(players.find(p => p.seatIndex === 2)?.position).toBe('BB')
    })

    it('assigns positions for 6-max table', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 1 }),
        createTestPlayer({ seatIndex: 2 }),
        createTestPlayer({ seatIndex: 3 }),
        createTestPlayer({ seatIndex: 4 }),
        createTestPlayer({ seatIndex: 5 })
      ]

      assignPositions(players, 0, 6)

      expect(players.find(p => p.seatIndex === 0)?.position).toBe('BTN')
      expect(players.find(p => p.seatIndex === 1)?.position).toBe('SB')
      expect(players.find(p => p.seatIndex === 2)?.position).toBe('BB')
      expect(players.find(p => p.seatIndex === 5)?.position).toBe('CO')
    })
  })

  describe('getSmallBlindSeatIndex', () => {
    it('returns button seat for heads-up', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 1 })
      ]

      expect(getSmallBlindSeatIndex(players, 0, 2)).toBe(0)
    })

    it('returns first seat after button for full ring', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 1 }),
        createTestPlayer({ seatIndex: 2 })
      ]

      expect(getSmallBlindSeatIndex(players, 0, 3)).toBe(1)
    })
  })

  describe('getBigBlindSeatIndex', () => {
    it('returns seat after small blind', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 1 }),
        createTestPlayer({ seatIndex: 2 })
      ]

      expect(getBigBlindSeatIndex(players, 0, 3)).toBe(2)
    })
  })

  describe('buildActionOrderSeats', () => {
    it('orders seats starting from SB', () => {
      const players = [
        createTestPlayer({ seatIndex: 0 }),
        createTestPlayer({ seatIndex: 1 }),
        createTestPlayer({ seatIndex: 2 })
      ]

      const order = buildActionOrderSeats(players, 0)

      // SB (seat 1) should be first, then BB (seat 2), then BTN (seat 0)
      expect(order).toEqual([1, 2, 0])
    })
  })
})

