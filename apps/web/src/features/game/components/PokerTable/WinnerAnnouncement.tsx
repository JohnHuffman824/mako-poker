interface WinnerData {
	isHero: boolean
	seatIndex: number
}

interface WinnerAnnouncementProps {
	winner: WinnerData
	winningHand: string | null
}

/**
 * Displays winner announcement with hand description.
 * Positioned by parent container using WINNER_ANNOUNCEMENT_POSITION.
 */
export function WinnerAnnouncement({ 
	winner, 
	winningHand 
}: WinnerAnnouncementProps) {
	const winnerText = winner.isHero
		? 'You win!'
		: `Seat ${winner.seatIndex + 1} wins!`

	return (
		<div 
			className="bg-black/80 text-white px-6 py-3 
								 rounded-lg text-center animate-pulse"
		>
			<div className="text-lg font-bold">{winnerText}</div>
			{winningHand && (
				<div className="text-sm text-gray-300">{winningHand}</div>
			)}
		</div>
	)
}
