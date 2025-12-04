import { useState } from 'react'
import { RemovePlayerButton, PlayingCard } from '../common'
import type { CardDto } from '@/api/client'

const CARD_BACK_IMG = '/assets/card-back-texture.png'

interface PlayerData {
  seatIndex: number
  position: string
  stack: number
  holeCards: CardDto[] | null
  lastAction: string | null
  isFolded: boolean
}

interface PixelPosition {
  top: number
  left: number
}

interface OpponentSeatProps {
  player: PlayerData
  position: PixelPosition
  isCurrentTurn: boolean
  isTopPosition: boolean
  canRemove: boolean
  bigBlind: number
  /** Whether hand is at showdown (AI cards should be revealed) */
  isShowdown?: boolean
  onRemove?: (seatIndex: number) => void
}

/**
 * Opponent seat with design-based pixel positioning.
 * Shows delete button on hover when canRemove is true.
 * Component sizes reduced by ~20% from original design.
 * 
 * Layout:
 * - Top players: Bubble on top, cards below
 * - Bottom players: Cards on top, bubble below
 * 
 * At showdown, AI player hole cards are revealed face-up.
 */
export function OpponentSeat({
  player,
  position,
  isCurrentTurn,
  isTopPosition,
  canRemove,
  bigBlind,
  isShowdown = false,
  onRemove,
}: OpponentSeatProps) {
  const [isHovered, setIsHovered] = useState(false)

  function handleRemove() {
    onRemove?.(player.seatIndex)
  }

  // Calculate BB from stack and current blind size
  const stackInBB = bigBlind > 0 ? Math.floor(player.stack / bigBlind) : 0

  // Show hole cards at showdown if player hasn't folded and has cards
  const showHoleCards = isShowdown && !player.isFolded && player.holeCards

  return (
    <div
      className="absolute inline-flex flex-col items-center
                 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: position.left,
        top: position.top,
        opacity: player.isFolded ? 0.4 : 1,
        flexDirection: isTopPosition ? 'column-reverse' : 'column',
        gap: 12,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cards - show face up at showdown, card backs otherwise */}
      <div
        className="inline-flex justify-center items-center"
        style={{ gap: 6 }}
      >
        {showHoleCards && player.holeCards ? (
          <>
            <OpponentRevealedCard card={player.holeCards[0]} />
            <OpponentRevealedCard card={player.holeCards[1]} />
          </>
        ) : (
          <>
            <OpponentCardBack />
            <OpponentCardBack />
          </>
        )}
      </div>

      {/* Stats bubble with remove button */}
      <OpponentStatsBubble
        stackBB={stackInBB}
        position={player.position}
        isCurrentTurn={isCurrentTurn}
        showRemove={canRemove && isHovered}
        onRemove={handleRemove}
      />
    </div>
  )
}

interface StatsBubbleProps {
  stackBB: number
  position: string
  isCurrentTurn: boolean
  showRemove: boolean
  onRemove: () => void
}

/**
 * Stats bubble for opponent players - reduced size by ~20%.
 * Shows remove button on hover when showRemove is true.
 */
function OpponentStatsBubble({
  stackBB,
  position,
  isCurrentTurn,
  showRemove,
  onRemove,
}: StatsBubbleProps) {
  const dropShadow = '4px 4px 3px 0px rgba(0, 0, 0, 0.35)'
  const activeBorder = '0 0 0 2px #facc15'

  return (
    <div
      className="relative rounded-[12px] border border-black
                 border-solid box-border inline-flex justify-center
                 items-center"
      style={{
        padding: 8,
        gap: 8,
        backgroundImage:
          `url('data:image/svg+xml;utf8,<svg viewBox="0 0 171 76"` +
          ` xmlns="http://www.w3.org/2000/svg"` +
          ` preserveAspectRatio="none"><rect x="0" y="0"` +
          ` height="100%" width="100%" fill="url(%23grad)"` +
          ` opacity="1"/><defs><radialGradient id="grad"` +
          ` gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10"` +
          ` gradientTransform="matrix(5.2354e-16 3.8 -8.55` +
          ` 2.3268e-16 85.5 38)"><stop stop-color="rgba(237,88,62,1)"` +
          ` offset="0.51442"/><stop stop-color="rgba(203,73,51,1)"` +
          ` offset="1"/></radialGradient></defs></svg>')`,
        boxShadow: isCurrentTurn
          ? `${dropShadow}, ${activeBorder}`
          : dropShadow,
      }}
    >
      {showRemove && <RemovePlayerButton onClick={onRemove} size={20} />}

      <div
        className="flex flex-col font-sf-compact justify-center
                   leading-[normal] not-italic relative shrink-0
                   text-black text-center text-nowrap whitespace-pre"
        style={{ fontSize: 24 }}
      >
        <p className="mb-0">{stackBB} BB</p>
        <p>{position}</p>
      </div>
    </div>
  )
}

/**
 * Opponent card back - reduced size by ~20% (40x56 from 50x70).
 */
function OpponentCardBack() {
  return (
    <div
      className="border border-black border-solid
                 relative rounded-[5px] shrink-0"
      style={{ width: 40, height: 56 }}
    >
      <div
        className="absolute inset-0 overflow-hidden
                   pointer-events-none rounded-[5px]"
      >
        <img
          alt=""
          className="absolute h-full left-[-1%] max-w-none top-0"
          style={{ width: '103.43%' }}
          src={CARD_BACK_IMG}
        />
      </div>
    </div>
  )
}

/**
 * Revealed card for opponent at showdown - same size as card back.
 */
function OpponentRevealedCard({ card }: { card: CardDto }) {
  return (
    <PlayingCard
      rank={card.rank}
      suit={card.suit}
      size="sm"
      colorScheme="quad-tone"
    />
  )
}
