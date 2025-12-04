import { GameConfig, CurrencyType } from './gameConfig'

/**
 * Default game configuration values.
 */
export const DEFAULT_CURRENCY_TYPE: CurrencyType = 'cash'

export const DEFAULT_GAME_CONFIG: GameConfig = {
  currencyType: DEFAULT_CURRENCY_TYPE,
  defaultStackSize: 200,
  defaultBigBlind: 2,
  defaultSmallBlind: 1,
  minPlayers: 2,
  maxPlayers: 10,
  minBlind: 1,
  maxBlind: 100,
}

/**
 * Design viewport dimensions for responsive scaling.
 */
export const DESIGN_VIEWPORT = {
  width: 1440,
  height: 900,
}

/**
 * Total seats at the poker table.
 */
export const TOTAL_SEATS = 10
export const HERO_SEAT_INDEX = 0

