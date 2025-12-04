/**
 * Game configuration types and interfaces.
 */

export type CurrencyType = 'cash' | 'tournament'

export interface GameConfig {
	currencyType: CurrencyType
	defaultStackSize: number
	defaultBigBlind: number
	defaultSmallBlind: number
	minPlayers: number
	maxPlayers: number
	minBlind: number
	maxBlind: number
}

/**
 * Currency display configuration.
 */
export interface CurrencyDisplay {
	prefix: string
	suffix: string
	decimals: number
}

export const CURRENCY_DISPLAY: Record<CurrencyType, CurrencyDisplay> = {
	cash: {
		prefix: '$',
		suffix: '',
		decimals: 0,
	},
	tournament: {
		prefix: '',
		suffix: ' chips',
		decimals: 0,
	},
}

/**
 * Formats a stack value based on currency type.
 */
export function formatStack(amount: number, currencyType: CurrencyType): string {
	const display = CURRENCY_DISPLAY[currencyType]
	const formatted = amount.toFixed(display.decimals)
	return `${display.prefix}${formatted}${display.suffix}`
}

/**
 * Calculates big blinds from stack size and blind amount.
 */
export function calculateBigBlinds(stackSize: number, bigBlind: number): number {
	if (bigBlind <= 0) return 0
	return Math.floor(stackSize / bigBlind)
}

