import type {
	GameState,
	StartGameRequest,
	PlayerActionRequest,
	Card
} from '@mako/shared'
import {
	STREET_PREFLOP,
	STREET_FLOP,
	STREET_TURN,
	STREET_RIVER,
	STREET_SHOWDOWN,
	createShuffledDeck
} from '@mako/shared'
import {
	createInternalGameState,
	toGameStateDto,
	createGameAggregate,
	appendEvent,
	type InternalGameState,
	type GameAggregate
} from '../domain/game-state'
import {
	GameEvents,
	filterEventsByType,
	type GameEvent
} from '../domain/game-events'
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

/**
 * In-memory game storage using event-sourced aggregates.
 * Keyed by both gameId and userId for easy lookup.
 */
const games = new Map<string, GameAggregate>()

/**
 * Gets the internal aggregate for a game.
 */
function getAggregate(gameId: string): GameAggregate | null {
	return games.get(gameId) ?? null
}

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

	// Create aggregate with initial event
	const initialEvent = GameEvents.gameStarted(gameId, userId, request, 1)
	const aggregate = createGameAggregate(game, userId, initialEvent)

	// Store by both game ID and user ID
	games.set(gameId, aggregate)
	games.set(userId, aggregate)

	return toGameStateDto(game)
}

/**
 * Gets the current game state.
 */
export function getGame(gameId: string): GameState | null {
	const aggregate = getAggregate(gameId)
	if (!aggregate) return null
	return toGameStateDto(
		aggregate.state,
		aggregate.state.street == STREET_SHOWDOWN
	)
}

/**
 * Gets the user's current game.
 */
export function getUserGame(userId: string): GameState | null {
	return getGame(userId)
}

/**
 * Gets the event history for a game.
 * Useful for AI training and game replay.
 */
export function getGameEvents(gameId: string): GameEvent[] {
	const aggregate = getAggregate(gameId)
	return aggregate?.events ?? []
}

/**
 * Gets events filtered by type.
 */
export function getGameEventsByType(
	gameId: string,
	type: GameEvent['type']
): GameEvent[] {
	const events = getGameEvents(gameId)
	return filterEventsByType(events, type)
}

/**
 * Gets the aggregate version (total number of events).
 */
export function getGameVersion(gameId: string): number {
	const aggregate = getAggregate(gameId)
	return aggregate?.version ?? 0
}

/**
 * Gets a summary of the game's event history.
 */
export function getGameEventSummary(gameId: string): {
	totalEvents: number
	handsPlayed: number
	actionsProcessed: number
	lastEventType: string | null
	createdAt: number | null
	updatedAt: number | null
} {
	const aggregate = getAggregate(gameId)
	if (!aggregate) {
		return {
			totalEvents: 0,
			handsPlayed: 0,
			actionsProcessed: 0,
			lastEventType: null,
			createdAt: null,
			updatedAt: null
		}
	}

	const events = aggregate.events
	return {
		totalEvents: events.length,
		handsPlayed: events.filter(e => e.type == 'HAND_DEALT').length,
		actionsProcessed: events.filter(e => e.type == 'ACTION_PROCESSED').length,
		lastEventType: events[events.length - 1]?.type ?? null,
		createdAt: aggregate.createdAt,
		updatedAt: aggregate.updatedAt
	}
}

/**
 * Resets game state for a new hand.
 */
function resetGameState(game: InternalGameState): void {
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
}

/**
 * Deals hole cards to all players.
 */
function dealHoleCards(
	game: InternalGameState
): Record<number, [Card, Card]> {
	const holeCards: Record<number, [Card, Card]> = {}
	for (const player of game.players) {
		const card1 = game.deck.shift()
		const card2 = game.deck.shift()
		if (card1 && card2) {
			player.holeCards = [card1, card2]
			holeCards[player.seatIndex] = [card1, card2]
		}
	}
	return holeCards
}

/**
 * Posts a single blind and returns the amount.
 */
function postBlind(
	game: InternalGameState,
	seatIndex: number,
	amount: number,
	action: 'SB' | 'BB'
): number {
	const playerIndex = seatIndexToPlayerIndex(game.players, seatIndex)
	if (playerIndex == null) {
		throw new Error('Blind player not found')
	}

	const player = game.players[playerIndex]
	const actualAmount = Math.min(amount, player.stack)
	player.currentBet = actualAmount
	player.stack -= actualAmount
	player.lastAction = action
	if (player.stack == 0) player.isAllIn = true
	recordContribution(
		game.playerContributions ?? {},
		seatIndex,
		actualAmount
	)

	return actualAmount
}

/**
 * Posts both small and big blinds.
 */
function postBlinds(game: InternalGameState): void {
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

	const sbAmount = postBlind(game, sbSeatIndex, game.blinds.small, 'SB')
	const bbAmount = postBlind(game, bbSeatIndex, game.blinds.big, 'BB')

	game.pot = sbAmount + bbAmount
	game.lastBet = bbAmount
	game.minRaise = bbAmount
}

/**
 * Deals a new hand.
 */
export function dealHand(gameId: string): GameState {
	const aggregate = getAggregate(gameId)
	if (!aggregate) {
		throw new Error('Game not found')
	}

	const game = aggregate.state
	if (game.isHandInProgress) {
		throw new Error('Hand already in progress')
	}

	resetGameState(game)

	const nextButtonSeat = findNextOccupiedSeat(
		game.players,
		game.dealerSeatIndex
	)
	if (nextButtonSeat == null) {
		throw new Error('No players found for button')
	}
	game.dealerSeatIndex = nextButtonSeat
	assignPositions(game.players, game.dealerSeatIndex, game.playerCount)

	const holeCards = dealHoleCards(game)
	postBlinds(game)

	game.isHandInProgress = true
	game.currentPlayerIndex = getFirstToActPreflop(
		game.players,
		game.dealerSeatIndex,
		game.playerCount
	)

	const event = GameEvents.handDealt(
		game.id,
		game.dealerSeatIndex,
		holeCards,
		[...game.deck],
		aggregate.version + 1
	)
	appendEvent(aggregate, event)

	return toGameStateDto(game)
}

/**
 * Handles post-action game state progression.
 */
function handlePostAction(
	aggregate: GameAggregate,
	previousStreet: string
): void {
	const game = aggregate.state

	if (shouldEndHand(game)) {
		endHandWithEvent(aggregate)
	} else if (isBettingRoundComplete(game)) {
		advanceStreetWithEvent(aggregate, previousStreet)
	} else {
		moveToNextPlayer(game)
	}
}

/**
 * Processes a player action.
 */
export function processAction(
	gameId: string,
	request: PlayerActionRequest
): GameState {
	const aggregate = getAggregate(gameId)
	if (!aggregate) {
		throw new Error('Game not found')
	}

	const game = aggregate.state
	if (!game.isHandInProgress) {
		throw new Error('No hand in progress')
	}

	const currentPlayer = game.players[game.currentPlayerIndex]
	const playerSeatIndex = currentPlayer.seatIndex
	const previousStreet = game.street

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

	handlePostAction(aggregate, previousStreet)

	const actionEvent = GameEvents.actionProcessed(
		game.id,
		playerSeatIndex,
		request,
		game.pot,
		game.street,
		aggregate.version + 1
	)
	appendEvent(aggregate, actionEvent)

	return toGameStateDto(game, game.street == STREET_SHOWDOWN)
}

/**
 * Processes AI action when it's not the hero's turn.
 */
export function processAiAction(gameId: string): GameState {
	const aggregate = getAggregate(gameId)
	if (!aggregate) {
		throw new Error('Game not found')
	}

	const game = aggregate.state
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
 * Gets aggregate and validates no hand in progress.
 */
function getAggregateForPlayerModification(gameId: string): GameAggregate {
	const aggregate = getAggregate(gameId)
	if (!aggregate) {
		throw new Error('Game not found')
	}

	if (aggregate.state.isHandInProgress) {
		throw new Error('Cannot modify players during hand')
	}

	return aggregate
}

/**
 * Updates positions and records player event.
 */
function updatePositionsAndRecordEvent(
	aggregate: GameAggregate,
	event: GameEvent
): void {
	const game = aggregate.state
	assignPositions(game.players, game.dealerSeatIndex, game.playerCount)
	appendEvent(aggregate, event)
}

/**
 * Adds a player at a specific seat.
 */
export function addPlayerAtSeat(gameId: string, seatIndex: number): GameState {
	const aggregate = getAggregateForPlayerModification(gameId)
	const game = aggregate.state

	if (seatIndex < 0 || seatIndex > 9) {
		throw new Error('Seat index must be between 0 and 9')
	}

	if (game.players.some(p => p.seatIndex == seatIndex)) {
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

	const event = GameEvents.playerAdded(
		game.id,
		seatIndex,
		startingStack,
		aggregate.version + 1
	)
	updatePositionsAndRecordEvent(aggregate, event)

	return toGameStateDto(game)
}

/**
 * Removes a player from a specific seat.
 */
export function removePlayerAtSeat(
	gameId: string,
	seatIndex: number
): GameState {
	const aggregate = getAggregateForPlayerModification(gameId)
	const game = aggregate.state

	const playerIndex = game.players.findIndex(p => p.seatIndex == seatIndex)
	if (playerIndex == -1) {
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

	const event = GameEvents.playerRemoved(
		game.id,
		seatIndex,
		aggregate.version + 1
	)
	updatePositionsAndRecordEvent(aggregate, event)

	return toGameStateDto(game)
}

/**
 * Adds a single AI player to the game.
 */
function addAiPlayer(
	game: InternalGameState,
	aggregate: GameAggregate,
	startingStack: number
): boolean {
	const usedSeats = new Set(game.players.map(p => p.seatIndex))
	let nextSeat = 0
	while (usedSeats.has(nextSeat) && nextSeat <= 9) nextSeat++

	if (nextSeat > 9) return false

	game.players.push(createPlayer({
		seatIndex: nextSeat,
		stack: startingStack,
		isHero: false
	}))

	const event = GameEvents.playerAdded(
		game.id,
		nextSeat,
		startingStack,
		aggregate.version + 1
	)
	appendEvent(aggregate, event)

	return true
}

/**
 * Removes a single AI player from the game.
 */
function removeAiPlayer(
	game: InternalGameState,
	aggregate: GameAggregate
): boolean {
	const lastNonHero = [...game.players]
		.reverse()
		.find(p => !p.isHero)
	if (!lastNonHero) return false

	const event = GameEvents.playerRemoved(
		game.id,
		lastNonHero.seatIndex,
		aggregate.version + 1
	)
	appendEvent(aggregate, event)

	game.players = game.players.filter(p => p != lastNonHero)
	return true
}

/**
 * Updates the player count by adding or removing AI players.
 */
export function updatePlayerCount(gameId: string, count: number): GameState {
	const aggregate = getAggregateForPlayerModification(gameId)
	const game = aggregate.state

	if (count < 2 || count > 10) {
		throw new Error('Player count must be between 2 and 10')
	}

	const startingStack = game.players[0]?.stack ?? 100

	while (game.players.length < count) {
		if (!addAiPlayer(game, aggregate, startingStack)) break
	}

	while (game.players.length > count) {
		if (!removeAiPlayer(game, aggregate)) break
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
	const aggregate = getAggregate(gameId)
	if (!aggregate) {
		throw new Error('Game not found')
	}

	const game = aggregate.state
	if (game.isHandInProgress) {
		throw new Error('Cannot change blinds during hand')
	}

	if (smallBlind <= 0 || bigBlind <= 0) {
		throw new Error('Blinds must be positive')
	}

	game.blinds = { small: smallBlind, big: bigBlind }
	game.minRaise = bigBlind

	// Record event
	const event = GameEvents.blindsUpdated(
		game.id,
		smallBlind,
		bigBlind,
		aggregate.version + 1
	)
	appendEvent(aggregate, event)

	return toGameStateDto(game)
}

/**
 * Checks if hand should end immediately (everyone folded).
 */
function shouldEndHand(game: InternalGameState): boolean {
	const activePlayers = game.players.filter(p => !p.isFolded)
	return activePlayers.length == 1
}

/**
 * Deals community cards based on current street.
 */
function dealCommunityCards(game: InternalGameState): Card[] {
	switch (game.street) {
		case STREET_PREFLOP:
			dealFlop(game)
			return game.communityCards.slice(0, 3)
		case STREET_FLOP:
			dealTurn(game)
			return game.communityCards.slice(3, 4)
		case STREET_TURN:
			dealRiver(game)
			return game.communityCards.slice(4, 5)
		default:
			return []
	}
}

/**
 * Advances to next street with event recording.
 */
function advanceStreetWithEvent(
	aggregate: GameAggregate,
	previousStreet: string
): void {
	const game = aggregate.state
	const activePlayers = game.players.filter(p => !p.isFolded && !p.isAllIn)
	const allPlayersAllIn = activePlayers.length == 0

	if (allPlayersAllIn) {
		const cardsBeforeDealing = game.communityCards.length
		dealRemainingCards(game)
		const newCards = game.communityCards.slice(cardsBeforeDealing)

		const event = GameEvents.streetAdvanced(
			game.id,
			previousStreet as any,
			STREET_RIVER,
			newCards,
			aggregate.version + 1
		)
		appendEvent(aggregate, event)

		game.street = STREET_RIVER
		goToShowdownWithEvent(aggregate)
		return
	}

	if (game.street == STREET_RIVER) {
		goToShowdownWithEvent(aggregate)
		return
	}

	if (game.street != STREET_PREFLOP &&
	    game.street != STREET_FLOP &&
	    game.street != STREET_TURN) {
		endHandWithEvent(aggregate)
		return
	}

	const fromStreet = game.street
	const newCommunityCards = dealCommunityCards(game)

	const event = GameEvents.streetAdvanced(
		game.id,
		fromStreet,
		game.street,
		newCommunityCards,
		aggregate.version + 1
	)
	appendEvent(aggregate, event)
}

/**
 * Proceeds to showdown with event recording.
 */
function goToShowdownWithEvent(aggregate: GameAggregate): void {
	aggregate.state.street = STREET_SHOWDOWN
	endHandWithEvent(aggregate)
}

/**
 * Determines winner when everyone else folded.
 */
function handleFoldWin(
	game: InternalGameState,
	activePlayers: any[]
): { seatIndex: number; hand: string; potAmount: number; isFold: boolean } {
	const winner = activePlayers[0]
	const result = determineWinnerByFold(winner.seatIndex, game.sidePots ?? [])
	distributeWinnings(game.players, result)
	game.winner = winner
	game.winningHand = 'Others folded'

	return {
		seatIndex: winner.seatIndex,
		hand: 'Others folded',
		potAmount: game.pot,
		isFold: true
	}
}

/**
 * Determines winners at showdown.
 */
function handleShowdownWin(
	game: InternalGameState,
	activePlayers: any[]
): { seatIndex: number | null; hand: string | null; potAmount: number; isFold: boolean } {
	const showdownPlayers: ShowdownPlayer[] = activePlayers.map(p => ({
		seatIndex: p.seatIndex,
		holeCards: p.holeCards ?? [],
		isFolded: p.isFolded
	}))

	const result = determineWinners(
		showdownPlayers,
		game.communityCards,
		game.sidePots ?? []
	)
	distributeWinnings(game.players, result)

	const mainPotResult = result.potWinners[0]
	if (mainPotResult && mainPotResult.winnerSeats.length > 0) {
		const winningSeat = mainPotResult.winnerSeats[0]
		const winner = game.players.find(p => p.seatIndex == winningSeat)
		game.winner = winner ?? null
		game.winningHand = mainPotResult.handDescription

		return {
			seatIndex: winningSeat,
			hand: mainPotResult.handDescription,
			potAmount: game.pot,
			isFold: false
		}
	}

	return {
		seatIndex: null,
		hand: null,
		potAmount: game.pot,
		isFold: false
	}
}

/**
 * Handles edge case winner determination.
 */
function handleEdgeCaseWin(
	game: InternalGameState,
	activePlayers: any[]
): { seatIndex: number; hand: string; potAmount: number; isFold: boolean } {
	const randomWinner = activePlayers[
		Math.floor(Math.random() * activePlayers.length)
	]
	randomWinner.stack += game.pot
	game.winner = randomWinner
	game.winningHand = 'Best hand'

	return {
		seatIndex: randomWinner.seatIndex,
		hand: 'Best hand',
		potAmount: game.pot,
		isFold: false
	}
}

/**
 * Cleans up game state after hand ends.
 */
function cleanupAfterHand(game: InternalGameState): void {
	game.pot = 0
	if (game.playerContributions) {
		resetContributions(game.playerContributions)
	}
	game.sidePots = []
	game.isHandInProgress = false
	game.currentPlayerIndex = -1
}

/**
 * Ends the hand and distributes winnings with event recording.
 */
function endHandWithEvent(aggregate: GameAggregate): void {
	const game = aggregate.state
	const activePlayers = game.players.filter(p => !p.isFolded)
	const activeSeats = new Set(activePlayers.map(p => p.seatIndex))

	game.sidePots = game.players.some(p => p.isAllIn)
		? calculatePots(game.playerContributions ?? {}, activeSeats)
		: createSimplePot(game.pot, activeSeats)

	let winnerInfo
	if (activePlayers.length == 1) {
		winnerInfo = handleFoldWin(game, activePlayers)
	} else if (game.communityCards.length == 5) {
		winnerInfo = handleShowdownWin(game, activePlayers)
	} else {
		winnerInfo = handleEdgeCaseWin(game, activePlayers)
	}

	const event = GameEvents.handEnded(
		game.id,
		winnerInfo.seatIndex,
		winnerInfo.hand,
		winnerInfo.potAmount,
		winnerInfo.isFold,
		aggregate.version + 1
	)
	appendEvent(aggregate, event)

	cleanupAfterHand(game)
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

	// No valid next player found - get aggregate and end hand
	const aggregate = games.get(game.id)
	if (aggregate) {
		endHandWithEvent(aggregate)
	}
}
