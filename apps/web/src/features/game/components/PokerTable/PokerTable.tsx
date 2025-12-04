import { GameStateResponse } from '@/api/client'
import { TableFelt } from './TableFelt'
import { WinnerAnnouncement } from './WinnerAnnouncement'
import { OpponentSeat } from './OpponentSeat'
import { CommunityCards } from './CommunityCards'
import {
	ALL_SEAT_POSITIONS,
	HERO_SEAT_INDEX,
	TABLE_CENTER,
	getDealerButtonPosition,
	getBetMarkerPosition,
	COMMUNITY_CARDS_POSITION,
	POT_DISPLAY_POSITION,
	WINNER_ANNOUNCEMENT_POSITION,
} from '../../constants/positions'
import {
	UI_SIZES,
	CARD_DISPLAY,
	POSITION_CLASSES,
} from '../../constants/game.constants'
import {
	PotDisplay,
	PlayingCard,
	CardPlaceholder,
	AddSeatButton,
	ButtonMarker,
	BetMarker,
} from '../common'

interface PokerTableProps {
	game: GameStateResponse
	isLoading: boolean
	onAddPlayer?: (seatIndex: number) => void
	onRemovePlayer?: (seatIndex: number) => void
}

/**
 * Main poker table with fixed 10 seats using design-based pixel positions.
 * Empty seats show add button, occupied seats show player.
 * Positions scale automatically via ScaledContainer parent.
 * 
 * Features:
 * - Bet markers showing each player's current bet
 * - AI cards revealed at showdown
 * - Dealer button with smooth animation
 */
export function PokerTable({
	game,
	isLoading,
	onAddPlayer,
	onRemovePlayer,
}: PokerTableProps) {
	const playersBySeat = new Map(
		game.players.map(p => [p.seatIndex, p])
	)

	const canModifySeats = !game.isHandInProgress && !isLoading
	const buttonPos = getDealerButtonPosition(game.dealerSeatIndex)
	const isShowdown = game.isShowdown

	return (
		<div className="absolute inset-0">
			{/* Centered table felt */}
			<div
				className="absolute -translate-x-1/2 -translate-y-1/2"
				style={{ top: TABLE_CENTER.top, left: TABLE_CENTER.left }}
			>
				<TableFelt />
			</div>

			{/* Winner announcement - positioned separately */}
			{game.winner && (
				<div
					className={POSITION_CLASSES.CENTERED_Z20}
					style={{
						top: WINNER_ANNOUNCEMENT_POSITION.top,
						left: WINNER_ANNOUNCEMENT_POSITION.left,
					}}
				>
					<WinnerAnnouncement
						winner={game.winner}
						winningHand={game.winningHand}
					/>
				</div>
			)}

			{/* Community cards - positioned separately to avoid overlap */}
			{game.communityCards.length > 0 && (
				<div
					className={POSITION_CLASSES.CENTERED_Z10}
					style={{
						top: COMMUNITY_CARDS_POSITION.top,
						left: COMMUNITY_CARDS_POSITION.left,
					}}
				>
					<CommunityCards cards={game.communityCards} />
				</div>
			)}

			{/* Pot display - positioned above community cards */}
			{game.pot > 0 && !game.winner && (
				<div
					className={POSITION_CLASSES.CENTERED_Z10}
					style={{
						top: POT_DISPLAY_POSITION.top,
						left: POT_DISPLAY_POSITION.left,
					}}
				>
					<PotDisplay pot={game.pot} />
				</div>
			)}

			{/* Dealer button - moves clockwise around table after each hand */}
			<ButtonMarker
				style={{
					position: 'absolute',
					top: buttonPos.top,
					left: buttonPos.left,
					transform: 'translate(-50%, -50%)',
					transition: 'top 0.8s ease-in-out, left 0.8s ease-in-out',
				}}
			/>

			{/* Action markers for players who have acted */}
			{game.players.map(player => {
				if (!player.lastAction) return null
				
				const betPos = getBetMarkerPosition(player.seatIndex)
				return (
					<div
						key={`action-${player.seatIndex}`}
						className={POSITION_CLASSES.CENTERED_Z10}
						style={{
							top: betPos.top,
							left: betPos.left,
						}}
					>
						<BetMarker
							lastAction={player.lastAction}
							currentBet={player.currentBet}
							bigBlind={game.blinds.big}
						/>
					</div>
				)
			})}

			{/* All 10 seats */}
			{ALL_SEAT_POSITIONS.map((pos, seatIndex) => {
				const player = playersBySeat.get(seatIndex)
				const isHeroSeat = seatIndex == HERO_SEAT_INDEX

				if (isHeroSeat) {
					return (
						<HeroSeat
							key={seatIndex}
							player={player ?? null}
							position={pos}
						/>
					)
				}

				if (player) {
					const isCurrentTurn =
						game.currentPlayerIndex == seatIndex && game.isHandInProgress
					const isTopPosition = pos.top <= UI_SIZES.TOP_SECTION_THRESHOLD

					return (
						<OpponentSeat
							key={seatIndex}
							player={player}
							position={pos}
							isCurrentTurn={isCurrentTurn}
							isTopPosition={isTopPosition}
							canRemove={canModifySeats}
							bigBlind={game.blinds.big}
							isShowdown={isShowdown}
							onRemove={onRemovePlayer}
						/>
					)
				}

				return (
					<EmptySeat
						key={seatIndex}
						seatIndex={seatIndex}
						position={pos}
						canAdd={canModifySeats}
						onAdd={onAddPlayer}
					/>
				)
			})}
		</div>
	)
}

interface PixelPosition {
	top: number
	left: number
}

interface EmptySeatProps {
	seatIndex: number
	position: PixelPosition
	canAdd: boolean
	onAdd?: (seatIndex: number) => void
}

/**
 * Empty seat showing add button.
 */
function EmptySeat({ seatIndex, position, canAdd, onAdd }: EmptySeatProps) {
	if (!canAdd) {
		return null
	}

	function handleAdd() {
		onAdd?.(seatIndex)
	}

	return (
		<div
			className={POSITION_CLASSES.CENTERED}
			style={{ left: position.left, top: position.top }}
		>
			<AddSeatButton
				onClick={handleAdd}
				size={UI_SIZES.ADD_SEAT_BUTTON_SIZE}
			/>
		</div>
	)
}

interface PlayerData {
	position: string
	stack: number
	holeCards: GameStateResponse['players'][0]['holeCards']
	lastAction: string | null
	isFolded: boolean
	currentBet: number
}

/**
 * Hero seat component displaying two large cards at the bottom.
 */
function HeroSeat({
	player,
	position,
}: {
	player: PlayerData | null
	position: PixelPosition
}) {
	const hasCards = (player?.holeCards?.length ?? 0) > 0

	return (
		<div
			className={POSITION_CLASSES.CENTERED}
			style={{
				left: position.left,
				top: position.top,
				opacity: player?.isFolded ? UI_SIZES.FOLDED_OPACITY : 1,
			}}
		>
			<div className="flex gap-3">
				<div
					style={{
						width: UI_SIZES.HERO_CARD_WIDTH,
						height: UI_SIZES.HERO_CARD_HEIGHT,
					}}
				>
					{hasCards ? (
						<PlayingCard
							rank={player!.holeCards![0].rank}
							suit={player!.holeCards![0].suit}
							size={CARD_DISPLAY.SIZE_HERO}
							colorScheme={CARD_DISPLAY.COLOR_SCHEME_QUAD_TONE}
						/>
					) : (
						<CardPlaceholder size={CARD_DISPLAY.SIZE_HERO} />
					)}
				</div>

				<div
					style={{
						width: UI_SIZES.HERO_CARD_WIDTH,
						height: UI_SIZES.HERO_CARD_HEIGHT,
					}}
				>
					{hasCards ? (
						<PlayingCard
							rank={player!.holeCards![1].rank}
							suit={player!.holeCards![1].suit}
							size={CARD_DISPLAY.SIZE_HERO}
							colorScheme={CARD_DISPLAY.COLOR_SCHEME_QUAD_TONE}
						/>
					) : (
						<CardPlaceholder size={CARD_DISPLAY.SIZE_HERO} />
					)}
				</div>
			</div>
		</div>
	)
}
