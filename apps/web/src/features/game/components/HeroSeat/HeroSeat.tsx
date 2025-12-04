import { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardPlaceholder, StatsBubble, BetChip } from '../common'

interface CardData {
  rank: string
  suit: string
}

interface HeroSeatProps {
  position: string
  stack: number
  holeCards: CardData[] | null
  lastAction: string | null
  isFolded: boolean
  currentBet: number
  isCurrentTurn: boolean
  style?: CSSProperties
}

/**
 * Hero's seat with large hole cards.
 * Action buttons are now in the bottom BettingControls bar.
 */
export function HeroSeat({
  position,
  stack,
  holeCards,
  lastAction,
  isFolded,
  currentBet,
  isCurrentTurn,
  style,
}: HeroSeatProps) {
  const hasCards = holeCards && holeCards.length > 0

  return (
    <div
      style={style}
      className={cn(
        'flex flex-col items-center gap-3',
        isFolded && 'opacity-40'
      )}
    >
      {/* Stats bubble - above cards for hero at bottom */}
      <StatsBubble
        stack={stack}
        position={position}
        lastAction={lastAction}
        isActive={isCurrentTurn}
        isHero
      />

      {/* Large hole cards */}
      <div className="flex gap-3">
        {hasCards ? (
          holeCards.map((card, i) => (
            <Card key={i} card={card} size="hero" />
          ))
        ) : (
          <>
            <CardPlaceholder size="hero" />
            <CardPlaceholder size="hero" />
          </>
        )}
      </div>

      {/* Current bet indicator */}
      {!isFolded && currentBet > 0 && (
        <BetChip amount={currentBet} isHero />
      )}
    </div>
  )
}
