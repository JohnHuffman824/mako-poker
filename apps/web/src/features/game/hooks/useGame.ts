import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { GAME_DEFAULTS } from '../constants/game.constants'

/**
 * Hook for managing game state and initialization.
 * Handles loading existing games and starting new ones.
 */
export function useGame() {
  const {
    game,
    isLoading,
    error,
    startGame,
    loadCurrentGame,
    clearError,
  } = useGameStore()

  const initializeGame = useCallback(async () => {
    await loadCurrentGame()
  }, [loadCurrentGame])

  const createNewGame = useCallback(async (
    playerCount: number = GAME_DEFAULTS.PLAYER_COUNT
  ) => {
    await startGame(playerCount)
  }, [startGame])

  // Auto-create game if none exists after loading
  useEffect(() => {
    if (!game && !isLoading) {
      createNewGame()
    }
  }, [game, isLoading, createNewGame])

  return {
    game,
    isLoading,
    error,
    initializeGame,
    createNewGame,
    clearError,
  }
}

