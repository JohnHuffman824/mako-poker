import type { Player } from '@mako/shared'
import { POSITION_NAMES } from '@mako/shared'

const MAX_SEAT_INDEX = 9

/**
 * Finds the next occupied seat clockwise from a given seat.
 */
export function findNextOccupiedSeat(
	players: Player[],
	fromSeat: number
): number | null {
	let currentSeat = (fromSeat + 1) % (MAX_SEAT_INDEX + 1)
	let checked = 0

	while (checked <= MAX_SEAT_INDEX) {
		const player = players.find(p => p.seatIndex === currentSeat)
		if (player) {
			return currentSeat
		}
		currentSeat = (currentSeat + 1) % (MAX_SEAT_INDEX + 1)
		checked++
	}
	return null
}

/**
 * Gets player at a specific seat.
 */
export function getPlayerAtSeat(
	players: Player[],
	seatIndex: number
): Player | null {
	return players.find(p => p.seatIndex === seatIndex) ?? null
}

/**
 * Converts seat index to player array index.
 */
export function seatIndexToPlayerIndex(
	players: Player[],
	seatIndex: number
): number | null {
	const index = players.findIndex(p => p.seatIndex === seatIndex)
	return index >= 0 ? index : null
}

/**
 * Assigns positions based on seat distance from button.
 */
export function assignPositions(
	players: Player[],
	dealerSeatIndex: number,
	playerCount: number
): void {
	const positions = POSITION_NAMES[playerCount] ??
		POSITION_NAMES[10] ??
		[]

	// Calculate clockwise distance from button for each occupied seat
	const seatsWithDistance = players.map(player => {
		const distance = (player.seatIndex - dealerSeatIndex +
			(MAX_SEAT_INDEX + 1)) % (MAX_SEAT_INDEX + 1)
		return { player, distance }
	}).sort((a, b) => a.distance - b.distance)

	// Assign positions
	for (let i = 0; i < seatsWithDistance.length; i++) {
		seatsWithDistance[i].player.position = positions[i] ?? '?'
	}
}

/**
 * Gets the seat index for small blind position.
 */
export function getSmallBlindSeatIndex(
	players: Player[],
	dealerSeatIndex: number,
	playerCount: number
): number {
	if (playerCount === 2) {
		// Heads-up: button posts small blind
		return dealerSeatIndex
	}
	// Full ring: first occupied seat clockwise from button
	const nextSeat = findNextOccupiedSeat(players, dealerSeatIndex)
	if (nextSeat === null) {
		throw new Error('No players for small blind')
	}
	return nextSeat
}

/**
 * Gets the seat index for big blind position.
 */
export function getBigBlindSeatIndex(
	players: Player[],
	dealerSeatIndex: number,
	playerCount: number
): number {
	const sbSeat = getSmallBlindSeatIndex(players, dealerSeatIndex, playerCount)
	const bbSeat = findNextOccupiedSeat(players, sbSeat)
	if (bbSeat === null) {
		throw new Error('No players for big blind')
	}
	return bbSeat
}

/**
 * Gets first player index to act preflop.
 */
export function getFirstToActPreflop(
	players: Player[],
	dealerSeatIndex: number,
	playerCount: number
): number {
	if (playerCount === 2) {
		// Heads-up: button acts first preflop
		const index = seatIndexToPlayerIndex(players, dealerSeatIndex)
		if (index === null) {
			throw new Error('Button player not found')
		}
		return index
	}

	// Full ring: first player after big blind
	const bbSeat = getBigBlindSeatIndex(players, dealerSeatIndex, playerCount)
	const utgSeat = findNextOccupiedSeat(players, bbSeat)
	if (utgSeat === null) {
		throw new Error('No UTG player found')
	}
	const index = seatIndexToPlayerIndex(players, utgSeat)
	if (index === null) {
		throw new Error('UTG player not found')
	}
	return index
}

/**
 * Gets first player to act post-flop (SB or first active after button).
 */
export function getFirstToActPostFlop(
	players: Player[],
	dealerSeatIndex: number,
	playerCount: number
): number {
	const sbSeat = playerCount === 2
		? dealerSeatIndex
		: findNextOccupiedSeat(players, dealerSeatIndex)

	if (sbSeat === null) {
		throw new Error('No SB found')
	}

	// Find first active player from SB position
	let currentSeat: number | null = sbSeat
	let checked = 0

	while (checked <= MAX_SEAT_INDEX && currentSeat !== null) {
		const player = players.find(
			p => p.seatIndex === currentSeat && !p.isFolded && !p.isAllIn
		)
		if (player) {
			return players.indexOf(player)
		}
		currentSeat = findNextOccupiedSeat(players, currentSeat)
		checked++
	}

	throw new Error('No active players for post-flop action')
}

/**
 * Builds action order seat list (SB first, BTN last).
 */
export function buildActionOrderSeats(
	players: Player[],
	dealerSeatIndex: number
): number[] {
	if (players.length === 0) return []

	const sbSeat = findNextOccupiedSeat(players, dealerSeatIndex)
	if (sbSeat === null) {
		return players.map(p => p.seatIndex)
	}

	const orderedSeats: number[] = []
	let currentSeat: number | null = sbSeat
	let count = 0

	while (count < players.length && currentSeat !== null) {
		if (players.some(p => p.seatIndex === currentSeat)) {
			orderedSeats.push(currentSeat)
		}
		currentSeat = findNextOccupiedSeat(players, currentSeat)
		count++
	}

	return orderedSeats
}

