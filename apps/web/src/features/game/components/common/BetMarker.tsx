/**
 * BetMarker component displays player actions and bets on the table.
 * Shows action text like CHECK, FOLD, RAISE TO X BB, or bet amounts.
 */

interface BetMarkerProps {
	/** Last action taken by player */
	lastAction: string | null
	/** Current bet amount for this round */
	currentBet: number
	/** Big blind size for BB calculations */
	bigBlind: number
}

/**
 * Formats action display text.
 * Backend sends action codes (CHECK, FOLD, CALL, SB, BB)
 * or formatted raises (RAISE TO X BB).
 */
function getActionDisplay(
	lastAction: string | null,
	currentBet: number,
	bigBlind: number
): string {
	if (!lastAction) return ''
	
	const action = lastAction.toUpperCase()
	
	if (action == 'FOLD') return 'FOLD'
	if (action == 'CHECK') return 'CHECK'
	if (action == 'ALL-IN') return 'ALL-IN'
	if (action.startsWith('RAISE')) return action
	
	if (action == 'CALL' || action == 'SB' || action == 'BB') {
		const betBB = Math.round(currentBet / bigBlind * 10) / 10
		return `${betBB} BB`
	}
	
	return ''
}

export function BetMarker({
	lastAction,
	currentBet,
	bigBlind,
}: BetMarkerProps) {
	const displayText = getActionDisplay(lastAction, currentBet, bigBlind)
	
	if (!displayText) return null

	return (
		<div
			className="relative flex items-center justify-center
								 rounded-[8px] border border-black px-3 py-1"
			style={{
				background: 'linear-gradient(180deg, #4A7C59 0%, #3A6247 100%)',
				boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.3)',
				minWidth: 45,
			}}
		>
			<span
				className="font-sf-compact text-black text-center
									 leading-none whitespace-nowrap"
				style={{
					fontSize: 14,
					fontWeight: 500,
				}}
			>
				{displayText}
			</span>
		</div>
	)
}

