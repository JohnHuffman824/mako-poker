import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Hook that automatically processes AI player actions with delays.
 * 
 * After hero's action, if the next player is AI:
 * 1. Waits 700ms delay
 * 2. Calls api.processAiAction()
 * 3. Updates game state
 * 4. Repeats until hero's turn or hand ends
 * 
 * This hook monitors game state and triggers AI action processing
 * when needed. The actual processing logic is in gameStore.
 */
export function useAiActionLoop() {
  const game = useGameStore(state => state.game)
  const processAiActions = useGameStore(state => state.processAiActions)

  useEffect(() => {
    // Only process if hand is in progress and it's not hero's turn
    if (!game?.isHandInProgress) return
    if (game.currentPlayerIndex == game.heroSeatIndex) return

    // Process AI actions
    processAiActions()
  }, [game?.isHandInProgress, game?.currentPlayerIndex, game?.heroSeatIndex, processAiActions])
}

