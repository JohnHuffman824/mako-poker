import { useEffect } from 'react'
import { useGame, useGameActions, useAuth, useRequireAuth } from './hooks'
import { PokerTable, GameControls, BettingControls } from './components'
import { ErrorToast, ScaledContainer } from './components/layout'

/**
 * Main game page with responsive viewport scaling.
 * Uses ScaledContainer to maintain consistent proportions across screen sizes.
 */
export function GamePage() {
  useRequireAuth()
  const { logout } = useAuth()
  const { game, isLoading, error, initializeGame, clearError } = useGame()

  const {
    autoDeal,
    handleDeal,
    handleFold,
    handleCall,
    handleRaise,
    handlePlayerCountChange,
    handleAutoDealToggle,
    handleAddPlayer,
    handleRemovePlayer,
    handleBlindSizeChange,
  } = useGameActions()

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  if (!game) {
    return <LoadingScreen />
  }

  const isHeroTurn = game.isHandInProgress &&
    game.currentPlayerIndex == game.heroSeatIndex

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{
        background: `radial-gradient(
          ellipse 50% 50% at 50% 50%,
          #B6E7FF 9%,
          #458CB0 100%
        )`
      }}
    >
      <ScaledContainer>
        {/* Mako Logo - top left */}
        <img
          className="absolute opacity-50"
          style={{ width: 64, height: 48, left: 8, top: 8 }}
          src="/assets/mako-logo.svg"
          alt="Mako"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />

        {/* Logout button - top right */}
        <button
          onClick={logout}
          className="absolute text-white/60 hover:text-white
                     text-sm px-3 py-2 transition-colors z-30"
          style={{ top: 8, right: 8 }}
        >
          Logout
        </button>

        {error && <ErrorToast message={error} onDismiss={clearError} />}

        {/* Game controls - left side */}
        <GameControls
          playerCount={game.playerCount}
          autoDeal={autoDeal}
          blindSize={game.blinds.big}
          isHandInProgress={game.isHandInProgress}
          isLoading={isLoading}
          onPlayerCountChange={handlePlayerCountChange}
          onAutoDealChange={handleAutoDealToggle}
          onBlindSizeChange={handleBlindSizeChange}
        />

        {/* Poker table */}
        <PokerTable
          game={game}
          isLoading={isLoading}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
        />

      </ScaledContainer>

      {/* Bottom controls area - outside ScaledContainer for full width */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-gray-600/40"
        style={{ height: 144 }}
      >
        {isHeroTurn ? (
          <div className="h-full flex items-center justify-center">
            <BettingControls
              toCall={game.toCall}
              minRaise={game.minRaise}
              maxRaise={game.maxRaise}
              pot={game.pot}
              isVisible={true}
              isLoading={isLoading}
              onFold={handleFold}
              onCall={handleCall}
              onRaise={handleRaise}
            />
          </div>
        ) : (
          !game.isHandInProgress && (
            <div className="h-full flex items-center justify-center">
              <button
                onClick={handleDeal}
                disabled={isLoading}
                className="relative bg-green-400 rounded-[10px]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:brightness-110 active:brightness-90 transition-all"
                style={{ width: 128, height: 44 }}
              >
                <div
                  className="absolute inset-0 flex items-center
                             justify-center text-gray-800 text-xl
                             font-normal font-sf-compact"
                >
                  {isLoading ? 'Dealing...' : 'Deal Hand'}
                </div>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div
      className="w-screen h-screen relative overflow-hidden
                 flex items-center justify-center"
      style={{
        background: `radial-gradient(
          ellipse 50% 50% at 50% 50%,
          #B6E7FF 9%,
          #458CB0 100%
        )`
      }}
    >
      <div className="text-white text-2xl font-sf-compact">
        Loading game...
      </div>
    </div>
  )
}
