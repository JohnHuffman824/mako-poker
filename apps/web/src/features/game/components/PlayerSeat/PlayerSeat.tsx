import { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardData, StatsBubble, BetChip } from '../common'

interface ApiCardData {
	rank: string
	suit: string
}

interface PlayerSeatProps {
	seatIndex: number
	position: string
	stack: number
	holeCards: ApiCardData[] | null
	lastAction: string | null
	isFolded: boolean
	currentBet: number
	isCurrentTurn: boolean
	bigBlind: number
	isTopPosition?: boolean
	style?: CSSProperties
}

/**
 * Displays an opponent's seat with cards and stats.
 * Layout varies based on position (top vs bottom of table).
 */
export function PlayerSeat({
	seatIndex,
	position,
	stack,
	holeCards,
	lastAction,
	isFolded,
	currentBet,
	isCurrentTurn,
	bigBlind,
	isTopPosition = false,
	style,
}: PlayerSeatProps) {
	const showCards = holeCards && holeCards.length > 0

	// Determine if this is a top position based on seat index
	// Seats 0, 1, 8 are typically at top of table
	const isTop = isTopPosition || seatIndex <= 2 || seatIndex >= 7

	return (
		<div
			style={style}
			className={cn(
				'flex flex-col items-center gap-2 transition-all duration-300',
				isFolded && 'opacity-40'
			)}
		>
			{/* For top positions: Cards first, then stats */}
			{isTop ? (
				<>
			{/* Cards */}
					<div className="flex gap-1.5">
				{showCards ? (
					holeCards.map((card, i) => (
						<Card key={i} card={card as CardData} size="sm" />
					))
				) : (
					<>
						<Card faceDown size="sm" />
						<Card faceDown size="sm" />
					</>
				)}
			</div>

			{/* Stats bubble */}
			<StatsBubble
				stack={stack}
				position={position}
				bigBlind={bigBlind}
				lastAction={lastAction}
				isActive={isCurrentTurn}
			/>
				</>
			) : (
				<>
					{/* For bottom positions: Stats first, then cards */}
					<StatsBubble
						stack={stack}
						position={position}
						bigBlind={bigBlind}
						lastAction={lastAction}
						isActive={isCurrentTurn}
					/>

					{/* Cards */}
					<div className="flex gap-1.5">
						{showCards ? (
							holeCards.map((card, i) => (
								<Card key={i} card={card as CardData} size="sm" />
							))
						) : (
							<>
								<Card faceDown size="sm" />
								<Card faceDown size="sm" />
							</>
						)}
					</div>
				</>
			)}

			{/* Current bet indicator */}
			{!isFolded && currentBet > 0 && (
				<BetChip
					amount={currentBet}
					className="absolute -bottom-8 left-1/2 -translate-x-1/2"
				/>
			)}
		</div>
	)
}
