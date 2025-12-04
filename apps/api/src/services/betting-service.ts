import type { Player } from '@mako/shared'
import type { InternalGameState } from '../domain/game-state'
import { recordContribution } from './pot-service'

/** Action display strings */
const ACTION_FOLD = 'Fold'
const ACTION_CHECK = 'Check'
const ACTION_CALL = 'Call'
const ACTION_ALL_IN = 'All-in'

/**
 * Handles a fold action.
 */
export function handleFold(player: Player): void {
	player.isFolded = true
	player.lastAction = ACTION_FOLD
}

/**
 * Handles a call or check action.
 */
export function handleCall(
	game: InternalGameState,
	player: Player
): void {
	const toCall = (game.lastBet ?? 0) - player.currentBet

	if (toCall === 0) {
		player.lastAction = ACTION_CHECK
		return
	}

	const actualCall = Math.min(toCall, player.stack)
	player.stack -= actualCall
	player.currentBet += actualCall
	game.pot += actualCall

	if (game.playerContributions) {
		recordContribution(game.playerContributions, player.seatIndex, actualCall)
	}

	if (actualCall < toCall) {
		player.lastAction = ACTION_ALL_IN
		player.isAllIn = true
	} else {
		player.lastAction = ACTION_CALL
	}

	if (player.stack === 0) {
		player.isAllIn = true
	}
}

/**
 * Handles a raise or bet action.
 */
export function handleRaise(
	game: InternalGameState,
	player: Player,
	amount: number
): void {
	const minRaiseRequired = (game.lastBet ?? 0) + game.minRaise

	// Validate minimum raise (unless going all-in)
	const isAllIn = amount >= player.stack + player.currentBet
	if (!isAllIn && amount < minRaiseRequired) {
		throw new Error(
			`Minimum raise is ${game.minRaise}. ` +
			`Must raise to at least ${minRaiseRequired} (currently ${amount})`
		)
	}

	const totalBet = Math.min(amount, player.stack + player.currentBet)
	const amountToAdd = totalBet - player.currentBet

	player.stack -= amountToAdd
	game.pot += amountToAdd

	if (game.playerContributions) {
		recordContribution(game.playerContributions, player.seatIndex, amountToAdd)
	}

	// Calculate new minimum raise: size of this raise
	const raiseSize = totalBet - (game.lastBet ?? 0)
	game.minRaise = raiseSize
	game.lastBet = totalBet
	player.currentBet = totalBet

	const raiseBBs = Math.floor(raiseSize / game.blinds.big)
	player.lastAction = `RAISE ${raiseBBs} BB`

	if (player.stack === 0) {
		player.isAllIn = true
		player.lastAction = ACTION_ALL_IN
	}
}

/**
 * Handles an all-in action.
 */
export function handleAllIn(
	game: InternalGameState,
	player: Player
): void {
	const allInAmount = player.stack + player.currentBet
	const amountToAdd = player.stack

	game.pot += amountToAdd

	if (game.playerContributions) {
		recordContribution(game.playerContributions, player.seatIndex, amountToAdd)
	}

	if (allInAmount > (game.lastBet ?? 0)) {
		game.minRaise = allInAmount + (allInAmount - (game.lastBet ?? 0))
		game.lastBet = allInAmount
	}

	player.currentBet = allInAmount
	player.stack = 0
	player.isAllIn = true
	player.lastAction = ACTION_ALL_IN
}

/**
 * Checks if current betting round is complete.
 */
export function isBettingRoundComplete(game: InternalGameState): boolean {
	const activePlayers = game.players.filter(p => !p.isFolded && !p.isAllIn)

	// If all active players are all-in, betting is done
	if (activePlayers.length === 0) {
		return true
	}

	// All players have acted and bets are equal
	const maxBet = Math.max(...game.players.map(p => p.currentBet))
	const allActed = activePlayers.every(player =>
		player.currentBet === maxBet &&
		player.lastAction !== null &&
		player.lastAction !== 'SB' &&
		player.lastAction !== 'BB'
	)

	return allActed
}

