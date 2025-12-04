import { create } from 'zustand'
import { api, GameStateResponse } from '@/api/client'

/**
 * Game store state interface.
 */
interface GameStore {
	game: GameStateResponse | null
	isLoading: boolean
	autoDeal: boolean
	error: string | null

	startGame: (playerCount: number) => Promise<void>
	dealHand: () => Promise<void>
	submitAction: (action: string, amount?: number) => Promise<void>
	processAiActions: () => Promise<void>
	setAutoDeal: (enabled: boolean) => void
	updatePlayerCount: (count: number) => Promise<void>
	addPlayerAtSeat: (seatIndex: number) => Promise<void>
	removePlayerAtSeat: (seatIndex: number) => Promise<void>
	updateBlindSize: (bigBlind: number) => Promise<void>
	loadCurrentGame: () => Promise<void>
	clearError: () => void
}

/**
 * Zustand store for poker game state management.
 */
export const useGameStore = create<GameStore>((set, get) => ({
	game: null,
	isLoading: false,
	autoDeal: false,
	error: null,

	/**
	 * Starts a new game with the specified player count.
	 */
	startGame: async (playerCount: number) => {
		set({ isLoading: true, error: null })
		try {
			const game = await api.startGame({
				playerCount,
				startingStack: 100,
				smallBlind: 0.5,
				bigBlind: 1,
			})
			set({ game, isLoading: false })
		} catch (err) {
			set({ 
				error: err instanceof Error ? err.message : 'Failed to start game',
				isLoading: false 
			})
		}
	},

	/**
	 * Deals a new hand.
	 */
	dealHand: async () => {
		const { game } = get()
		if (!game) return

		set({ isLoading: true, error: null })
		try {
			const updatedGame = await api.dealHand(game.id)
			set({ game: updatedGame, isLoading: false })

			// If it's not hero's turn after dealing, process AI actions
			if (updatedGame.currentPlayerIndex !== updatedGame.heroSeatIndex) {
				await get().processAiActions()
			}
		} catch (err) {
			set({ 
				error: err instanceof Error ? err.message : 'Failed to deal hand',
				isLoading: false 
			})
		}
	},

	/**
	 * Submits a player action.
	 */
	submitAction: async (action: string, amount?: number) => {
		const { game } = get()
		if (!game) return

		set({ isLoading: true, error: null })
		try {
			const updatedGame = await api.submitAction(game.id, { action, amount })
			set({ game: updatedGame, isLoading: false })

			// Process AI actions if hand is still in progress
			if (updatedGame.isHandInProgress && 
					updatedGame.currentPlayerIndex !== updatedGame.heroSeatIndex) {
				await get().processAiActions()
			}

			// Auto deal next hand if enabled and hand ended
			if (!updatedGame.isHandInProgress && get().autoDeal) {
				setTimeout(() => get().dealHand(), 2000)
			}
		} catch (err) {
			set({ 
				error: err instanceof Error ? err.message : 'Failed to submit action',
				isLoading: false 
			})
		}
	},

	/**
	 * Processes AI actions until it's hero's turn or hand ends.
	 * Adds 700ms delay between each action for visual realism.
	 */
	processAiActions: async () => {
		const { game } = get()
		if (!game?.isHandInProgress) return

		let currentGame = game
		let iterations = 0
		const maxIterations = 20

		while (currentGame.isHandInProgress && 
					 currentGame.currentPlayerIndex !== currentGame.heroSeatIndex &&
					 iterations < maxIterations) {
			
			// Delay between AI actions for visual feedback
			await new Promise(resolve => setTimeout(resolve, 700))
			
			try {
				currentGame = await api.processAiAction(currentGame.id)
				set({ game: currentGame })
				iterations++
			} catch {
				break
			}
		}

		// Auto deal if hand ended and auto deal is enabled
		if (!currentGame.isHandInProgress && get().autoDeal) {
			setTimeout(() => get().dealHand(), 2000)
		}
	},

	/**
	 * Toggles auto deal mode.
	 */
	setAutoDeal: (enabled: boolean) => {
		set({ autoDeal: enabled })
	},

	/**
	 * Updates the player count (legacy method).
	 */
	updatePlayerCount: async (count: number) => {
		const { game } = get()
		if (!game) return

		set({ isLoading: true, error: null })
		try {
			const updatedGame = await api.updatePlayerCount(game.id, count)
			set({ game: updatedGame, isLoading: false })
		} catch (err) {
			set({ 
				error: err instanceof Error ? err.message : 'Failed to update player count',
				isLoading: false 
			})
		}
	},

	/**
	 * Adds a player to a specific seat.
	 */
	addPlayerAtSeat: async (seatIndex: number) => {
		const { game } = get()
		if (!game) return

		set({ isLoading: true, error: null })
		try {
			const updatedGame = await api.addPlayerAtSeat(game.id, seatIndex)
			set({ game: updatedGame, isLoading: false })
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : 'Failed to add player',
				isLoading: false
			})
		}
	},

	/**
	 * Removes a player from a specific seat.
	 */
	removePlayerAtSeat: async (seatIndex: number) => {
		const { game } = get()
		if (!game) return

		set({ isLoading: true, error: null })
		try {
			const updatedGame = await api.removePlayerAtSeat(game.id, seatIndex)
			set({ game: updatedGame, isLoading: false })
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : 'Failed to remove player',
				isLoading: false
			})
		}
	},

	/**
	 * Updates the blind size. Recalculates all player stack displays.
	 */
	updateBlindSize: async (bigBlind: number) => {
		const { game } = get()
		if (!game) return

		set({ isLoading: true, error: null })
		try {
			const updatedGame = await api.updateBlinds(game.id, bigBlind)
			set({ game: updatedGame, isLoading: false })
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : 'Failed to update blinds',
				isLoading: false
			})
		}
	},

	/**
	 * Loads the user's current game if one exists.
	 */
	loadCurrentGame: async () => {
		set({ isLoading: true, error: null })
		try {
			const game = await api.getCurrentGame()
			set({ game, isLoading: false })
		} catch (err) {
			set({ game: null, isLoading: false })
		}
	},

	/**
	 * Clears any error state.
	 */
	clearError: () => {
		set({ error: null })
	},
}))

