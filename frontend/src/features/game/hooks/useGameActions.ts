import { useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Hook for game action handlers.
 * Provides callbacks for player actions, dealing, and settings.
 */
export function useGameActions() {
  const {
    game,
    isLoading,
    autoDeal,
    dealHand,
    submitAction,
    setAutoDeal,
    updatePlayerCount,
    addPlayerAtSeat,
    removePlayerAtSeat,
    updateBlindSize,
  } = useGameStore()

  const handleDeal = useCallback(async () => {
    await dealHand()
  }, [dealHand])

  const handleAction = useCallback(async (
    action: string,
    amount?: number
  ) => {
    await submitAction(action, amount)
  }, [submitAction])

  const handleFold = useCallback(() => {
    handleAction('fold')
  }, [handleAction])

  const handleCall = useCallback(() => {
    const toCall = game?.toCall ?? 0
    handleAction(toCall == 0 ? 'check' : 'call')
  }, [handleAction, game?.toCall])

  const handleRaise = useCallback((amount: number) => {
    handleAction('raise', amount)
  }, [handleAction])

  const handlePlayerCountChange = useCallback(async (count: number) => {
    await updatePlayerCount(count)
  }, [updatePlayerCount])

  const handleAutoDealToggle = useCallback((enabled: boolean) => {
    setAutoDeal(enabled)
  }, [setAutoDeal])

  const handleAddPlayer = useCallback(async (seatIndex: number) => {
    await addPlayerAtSeat(seatIndex)
  }, [addPlayerAtSeat])

  const handleRemovePlayer = useCallback(async (seatIndex: number) => {
    await removePlayerAtSeat(seatIndex)
  }, [removePlayerAtSeat])

  const handleBlindSizeChange = useCallback(async (blindSize: number) => {
    await updateBlindSize(blindSize)
  }, [updateBlindSize])

  return {
    // State
    isLoading,
    autoDeal,
    isHandInProgress: game?.isHandInProgress ?? false,
    playerCount: game?.playerCount ?? 6,
    toCall: game?.toCall ?? 0,
    minRaise: game?.minRaise ?? 0,
    maxRaise: game?.maxRaise ?? 0,
    pot: game?.pot ?? 0,

    // Actions
    handleDeal,
    handleAction,
    handleFold,
    handleCall,
    handleRaise,
    handlePlayerCountChange,
    handleAutoDealToggle,
    handleAddPlayer,
    handleRemovePlayer,
    handleBlindSizeChange,
  }
}

