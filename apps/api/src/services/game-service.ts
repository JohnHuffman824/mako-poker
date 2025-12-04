import type {
  GameState,
  StartGameRequest,
  PlayerActionRequest
} from '@mako/shared'
import {
  STREET_PREFLOP,
  STREET_FLOP,
  STREET_TURN,
  STREET_RIVER,
  STREET_SHOWDOWN
} from '@mako/shared'
import {
  createInternalGameState,
  toGameStateDto,
  type InternalGameState
} from '../domain/game-state'
import { createShuffledDeck } from '../domain/card'
import { resetPlayer, createPlayer } from '../domain/player'
import {
  assignPositions,
  getSmallBlindSeatIndex,
  getBigBlindSeatIndex,
  getFirstToActPreflop,
  seatIndexToPlayerIndex,
  findNextOccupiedSeat
} from './position-service'
import {
  recordContribution,
  resetContributions,
  calculatePots,
  createSimplePot
} from './pot-service'
import {
  handleFold,
  handleCall,
  handleRaise,
  handleAllIn,
  isBettingRoundComplete
} from './betting-service'
import {
  dealFlop,
  dealTurn,
  dealRiver,
  dealRemainingCards
} from './street-service'
import {
  determineWinnerByFold,
  determineWinners,
  distributeWinnings,
  type ShowdownPlayer
} from './showdown-service'
import { determineAction, type ActionContext } from './ai-service'

/** In-memory game storage (keyed by both gameId and userId) */
const games = new Map<string, InternalGameState>()

/**
 * Starts a new game with the specified configuration.
 */
export function startGame(
  userId: string,
  request: StartGameRequest
): GameState {
  const gameId = crypto.randomUUID()

  const game = createInternalGameState({
    id: gameId,
    playerCount: request.playerCount,
    startingStack: request.startingStack,
    smallBlind: request.smallBlind,
    bigBlind: request.bigBlind
  })

  // Initial button position: last occupied seat
  game.dealerSeatIndex = game.players.reduce(
    (max, p) => Math.max(max, p.seatIndex),
    0
  )

  assignPositions(game.players, game.dealerSeatIndex, game.playerCount)

  // Store by both game ID and user ID
  games.set(gameId, game)
  games.set(userId, game)

  return toGameStateDto(game)
}

/**
 * Gets the current game state.
 */
export function getGame(gameId: string): GameState | null {
  const game = games.get(gameId)
  if (!game) return null
  return toGameStateDto(game, game.street === STREET_SHOWDOWN)
}

/**
 * Gets the user's current game.
 */
export function getUserGame(userId: string): GameState | null {
  return getGame(userId)
}

/**
 * Deals a new hand.
 */
export function dealHand(gameId: string): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (game.isHandInProgress) {
    throw new Error('Hand already in progress')
  }

  // Reset game state
  game.deck = createShuffledDeck()
  game.pot = 0
  game.communityCards = []
  game.street = STREET_PREFLOP
  game.winner = null
  game.winningHand = null
  game.sidePots = []

  // Reset contributions
  if (game.playerContributions) {
    resetContributions(game.playerContributions)
  } else {
    game.playerContributions = {}
  }

  // Reset all players
  for (const player of game.players) {
    resetPlayer(player)
  }

  // Move dealer button clockwise to next occupied seat
  const nextButtonSeat = findNextOccupiedSeat(
    game.players,
    game.dealerSeatIndex
  )
  if (nextButtonSeat === null) {
    throw new Error('No players found for button')
  }
  game.dealerSeatIndex = nextButtonSeat
  assignPositions(game.players, game.dealerSeatIndex, game.playerCount)

  // Deal hole cards
  for (const player of game.players) {
    const card1 = game.deck.shift()
    const card2 = game.deck.shift()
    if (card1 && card2) {
      player.holeCards = [card1, card2]
    }
  }

  // Post blinds
  const sbSeatIndex = getSmallBlindSeatIndex(
    game.players,
    game.dealerSeatIndex,
    game.playerCount
  )
  const bbSeatIndex = getBigBlindSeatIndex(
    game.players,
    game.dealerSeatIndex,
    game.playerCount
  )

  const sbPlayerIndex = seatIndexToPlayerIndex(game.players, sbSeatIndex)
  const bbPlayerIndex = seatIndexToPlayerIndex(game.players, bbSeatIndex)

  if (sbPlayerIndex === null || bbPlayerIndex === null) {
    throw new Error('Blind players not found')
  }

  const sbPlayer = game.players[sbPlayerIndex]
  const sbAmount = Math.min(game.blinds.small, sbPlayer.stack)
  sbPlayer.currentBet = sbAmount
  sbPlayer.stack -= sbAmount
  sbPlayer.lastAction = 'SB'
  if (sbPlayer.stack === 0) sbPlayer.isAllIn = true
  recordContribution(game.playerContributions, sbSeatIndex, sbAmount)

  const bbPlayer = game.players[bbPlayerIndex]
  const bbAmount = Math.min(game.blinds.big, bbPlayer.stack)
  bbPlayer.currentBet = bbAmount
  bbPlayer.stack -= bbAmount
  bbPlayer.lastAction = 'BB'
  if (bbPlayer.stack === 0) bbPlayer.isAllIn = true
  recordContribution(game.playerContributions, bbSeatIndex, bbAmount)

  game.pot = sbAmount + bbAmount
  game.lastBet = bbAmount
  game.minRaise = bbAmount
  game.isHandInProgress = true

  // Set action to first player after BB
  game.currentPlayerIndex = getFirstToActPreflop(
    game.players,
    game.dealerSeatIndex,
    game.playerCount
  )

  return toGameStateDto(game)
}

/**
 * Processes a player action.
 */
export function processAction(
  gameId: string,
  request: PlayerActionRequest
): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (!game.isHandInProgress) {
    throw new Error('No hand in progress')
  }

  const currentPlayer = game.players[game.currentPlayerIndex]

  switch (request.action.toLowerCase()) {
    case 'fold':
      handleFold(currentPlayer)
      break
    case 'call':
    case 'check':
      handleCall(game, currentPlayer)
      break
    case 'raise':
    case 'bet':
      handleRaise(game, currentPlayer, request.amount ?? game.minRaise)
      break
    case 'allin':
      handleAllIn(game, currentPlayer)
      break
    default:
      throw new Error(`Invalid action: ${request.action}`)
  }

  // Check for hand end (everyone folded)
  if (shouldEndHand(game)) {
    endHand(game)
  } else if (isBettingRoundComplete(game)) {
    // Betting round complete - advance to next street
    advanceStreet(game)
  } else {
    moveToNextPlayer(game)
  }

  return toGameStateDto(game, game.street === STREET_SHOWDOWN)
}

/**
 * Processes AI action when it's not the hero's turn.
 */
export function processAiAction(gameId: string): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (!game.isHandInProgress) {
    return toGameStateDto(game)
  }

  const currentPlayer = game.players[game.currentPlayerIndex]
  if (currentPlayer.isHero) {
    return toGameStateDto(game)
  }

  const context: ActionContext = {
    toCall: (game.lastBet ?? 0) - currentPlayer.currentBet,
    playerStack: currentPlayer.stack,
    lastBet: game.lastBet ?? 0,
    minRaise: game.minRaise,
    pot: game.pot,
    street: game.street,
    position: currentPlayer.position
  }

  const action = determineAction(context)
  return processAction(gameId, action)
}

/**
 * Ends the current game.
 */
export function endGame(gameId: string, userId: string): void {
  games.delete(gameId)
  games.delete(userId)
}

/**
 * Adds a player at a specific seat.
 */
export function addPlayerAtSeat(gameId: string, seatIndex: number): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (game.isHandInProgress) {
    throw new Error('Cannot add player during hand')
  }

  if (seatIndex < 0 || seatIndex > 9) {
    throw new Error('Seat index must be between 0 and 9')
  }

  if (game.players.some(p => p.seatIndex === seatIndex)) {
    throw new Error(`Seat ${seatIndex} is already occupied`)
  }

  if (game.players.length >= 10) {
    throw new Error('Cannot have more than 10 players')
  }

  const startingStack = game.players[0]?.stack ?? 100

  const newPlayer = createPlayer({
    seatIndex,
    stack: startingStack,
    isHero: false
  })

  game.players.push(newPlayer)
  game.players.sort((a, b) => a.seatIndex - b.seatIndex)
  game.playerCount = game.players.length

  assignPositions(game.players, game.dealerSeatIndex, game.playerCount)

  return toGameStateDto(game)
}

/**
 * Removes a player from a specific seat.
 */
export function removePlayerAtSeat(
  gameId: string,
  seatIndex: number
): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (game.isHandInProgress) {
    throw new Error('Cannot remove player during hand')
  }

  const playerIndex = game.players.findIndex(p => p.seatIndex === seatIndex)
  if (playerIndex === -1) {
    throw new Error(`No player at seat ${seatIndex}`)
  }

  if (game.players[playerIndex].isHero) {
    throw new Error('Cannot remove the hero player')
  }

  if (game.players.length <= 2) {
    throw new Error('Cannot have fewer than 2 players')
  }

  game.players.splice(playerIndex, 1)
  game.playerCount = game.players.length

  assignPositions(game.players, game.dealerSeatIndex, game.playerCount)

  return toGameStateDto(game)
}

/**
 * Updates the player count by adding or removing AI players.
 */
export function updatePlayerCount(gameId: string, count: number): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (game.isHandInProgress) {
    throw new Error('Cannot change player count during hand')
  }

  if (count < 2 || count > 10) {
    throw new Error('Player count must be between 2 and 10')
  }

  const startingStack = game.players[0]?.stack ?? 100

  while (game.players.length < count) {
    const usedSeats = new Set(game.players.map(p => p.seatIndex))
    let nextSeat = 0
    while (usedSeats.has(nextSeat) && nextSeat <= 9) nextSeat++

    if (nextSeat > 9) break

    game.players.push(createPlayer({
      seatIndex: nextSeat,
      stack: startingStack,
      isHero: false
    }))
  }

  while (game.players.length > count) {
    const lastNonHero = [...game.players]
      .reverse()
      .find(p => !p.isHero)
    if (!lastNonHero) break
    game.players = game.players.filter(p => p !== lastNonHero)
  }

  game.players.sort((a, b) => a.seatIndex - b.seatIndex)
  game.playerCount = game.players.length

  assignPositions(game.players, game.dealerSeatIndex, game.playerCount)

  return toGameStateDto(game)
}

/**
 * Updates the blind sizes.
 */
export function updateBlinds(
  gameId: string,
  smallBlind: number,
  bigBlind: number
): GameState {
  const game = games.get(gameId)
  if (!game) {
    throw new Error('Game not found')
  }

  if (game.isHandInProgress) {
    throw new Error('Cannot change blinds during hand')
  }

  if (smallBlind <= 0 || bigBlind <= 0) {
    throw new Error('Blinds must be positive')
  }

  game.blinds = { small: smallBlind, big: bigBlind }
  game.minRaise = bigBlind

  return toGameStateDto(game)
}

/**
 * Checks if hand should end immediately (everyone folded).
 */
function shouldEndHand(game: InternalGameState): boolean {
  const activePlayers = game.players.filter(p => !p.isFolded)
  return activePlayers.length === 1
}

/**
 * Advances to next street or ends hand at showdown.
 */
function advanceStreet(game: InternalGameState): void {
  const activePlayers = game.players.filter(p => !p.isFolded && !p.isAllIn)
  const allPlayersAllIn = activePlayers.length === 0

  if (allPlayersAllIn) {
    dealRemainingCards(game)
    game.street = STREET_RIVER
    goToShowdown(game)
    return
  }

  switch (game.street) {
    case STREET_PREFLOP:
      dealFlop(game)
      break
    case STREET_FLOP:
      dealTurn(game)
      break
    case STREET_TURN:
      dealRiver(game)
      break
    case STREET_RIVER:
      goToShowdown(game)
      break
    default:
      endHand(game)
  }
}

/**
 * Proceeds to showdown.
 */
function goToShowdown(game: InternalGameState): void {
  game.street = STREET_SHOWDOWN
  endHand(game)
}

/**
 * Ends the hand and distributes winnings.
 */
function endHand(game: InternalGameState): void {
  const activePlayers = game.players.filter(p => !p.isFolded)
  const activeSeats = new Set(activePlayers.map(p => p.seatIndex))

  // Calculate side pots
  game.sidePots = game.players.some(p => p.isAllIn)
    ? calculatePots(game.playerContributions ?? {}, activeSeats)
    : createSimplePot(game.pot, activeSeats)

  if (activePlayers.length === 1) {
    // Everyone else folded
    const winner = activePlayers[0]
    const result = determineWinnerByFold(winner.seatIndex, game.sidePots)
    distributeWinnings(game.players, result)
    game.winner = winner
    game.winningHand = 'Others folded'
  } else if (game.communityCards.length === 5) {
    // Showdown with full board
    const showdownPlayers: ShowdownPlayer[] = activePlayers.map(p => ({
      seatIndex: p.seatIndex,
      holeCards: p.holeCards ?? [],
      isFolded: p.isFolded
    }))

    const result = determineWinners(
      showdownPlayers,
      game.communityCards,
      game.sidePots
    )
    distributeWinnings(game.players, result)

    // Set winner info (main pot winner for display)
    const mainPotResult = result.potWinners[0]
    if (mainPotResult && mainPotResult.winnerSeats.length > 0) {
      const winningSeat = mainPotResult.winnerSeats[0]
      game.winner = game.players.find(p => p.seatIndex === winningSeat) ?? null
      game.winningHand = mainPotResult.handDescription
    }
  } else {
    // Multiple players but not full board (edge case)
    const randomWinner = activePlayers[
      Math.floor(Math.random() * activePlayers.length)
    ]
    randomWinner.stack += game.pot
    game.winner = randomWinner
    game.winningHand = 'Best hand'
  }

  // Reset for next hand
  game.pot = 0
  if (game.playerContributions) {
    resetContributions(game.playerContributions)
  }
  game.sidePots = []
  game.isHandInProgress = false
  game.currentPlayerIndex = -1
}

/**
 * Moves to the next player.
 */
function moveToNextPlayer(game: InternalGameState): void {
  let nextIndex = (game.currentPlayerIndex + 1) % game.playerCount
  let loopCount = 0

  while (loopCount < game.playerCount) {
    const player = game.players[nextIndex]
    if (!player.isFolded && !player.isAllIn) {
      game.currentPlayerIndex = nextIndex
      return
    }
    nextIndex = (nextIndex + 1) % game.playerCount
    loopCount++
  }

  // No valid next player found
  endHand(game)
}

