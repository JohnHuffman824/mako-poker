import type { Player } from '@mako/shared'
import { createCard } from '@mako/shared'

// Re-export createCard for test files
export { createCard }

/**
 * Creates a test player.
 */
export function createTestPlayer(
	overrides: Partial<Player> = {}
): Player {
	return {
		seatIndex: 0,
		position: 'BTN',
		stack: 100,
		holeCards: null,
		lastAction: null,
		isFolded: false,
		isAllIn: false,
		currentBet: 0,
		isHero: false,
		...overrides
	}
}
