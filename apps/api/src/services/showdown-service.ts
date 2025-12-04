import type { Card, Player, SidePot } from '@mako/shared'
import { evaluateHand, formatHandResult } from '../domain/hand-evaluator'

/**
 * Player info needed for showdown.
 */
export interface ShowdownPlayer {
	seatIndex: number
	holeCards: Card[]
	isFolded: boolean
}

/**
 * Result for a single pot.
 */
export interface PotWinner {
	potId: number
	winnerSeats: number[]
	amountPerWinner: number
	handDescription: string
}

/**
 * Complete showdown result.
 */
export interface ShowdownResult {
	potWinners: PotWinner[]
}

/**
 * Determines winners when everyone else folded.
 */
export function determineWinnerByFold(
	winnerSeat: number,
	pots: SidePot[]
): ShowdownResult {
	const potWinners: PotWinner[] = pots.map(pot => ({
		potId: pot.id,
		winnerSeats: [winnerSeat],
		amountPerWinner: pot.amount,
		handDescription: 'Others folded'
	}))

	return { potWinners }
}

/**
 * Determines winners at showdown.
 */
export function determineWinners(
	players: ShowdownPlayer[],
	communityCards: Card[],
	pots: SidePot[]
): ShowdownResult {
	// Evaluate all non-folded players' hands
	const playerHands = players
		.filter(p => !p.isFolded && p.holeCards.length === 2)
		.map(player => {
			const result = evaluateHand(player.holeCards, communityCards)
			return {
				seatIndex: player.seatIndex,
				rank: result.absoluteRank,
				description: formatHandResult(result)
			}
		})

	const potWinners: PotWinner[] = []

	for (const pot of pots) {
		// Filter to players eligible for this pot
		const eligible = playerHands.filter(p =>
			pot.eligiblePlayerSeats.includes(p.seatIndex)
		)

		if (eligible.length === 0) continue

		// Find best hand among eligible players
		const bestRank = Math.max(...eligible.map(p => p.rank))
		const winners = eligible.filter(p => p.rank === bestRank)

		// Split pot among winners
		const amountPerWinner = pot.amount / winners.length

		potWinners.push({
			potId: pot.id,
			winnerSeats: winners.map(w => w.seatIndex),
			amountPerWinner,
			handDescription: winners[0]?.description ?? 'Best hand'
		})
	}

	return { potWinners }
}

/**
 * Distributes winnings to players.
 */
export function distributeWinnings(
	players: Player[],
	showdownResult: ShowdownResult
): void {
	for (const potWinner of showdownResult.potWinners) {
		for (const winningSeat of potWinner.winnerSeats) {
			const player = players.find(p => p.seatIndex === winningSeat)
			if (player) {
				player.stack += potWinner.amountPerWinner
			}
		}
	}
}

