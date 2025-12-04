/**
 * X button to remove a player from a seat.
 * Shows on hover over the player's stats bubble.
 * Black circle with white X.
 */

interface RemovePlayerButtonProps {
	onClick: () => void
	size?: number
}

export function RemovePlayerButton({
	onClick,
	size = 20
}: RemovePlayerButtonProps) {
	return (
		<button
			onClick={(e) => {
				e.stopPropagation()
				onClick()
			}}
			className="absolute -top-2 -left-2 cursor-pointer z-10
								 hover:opacity-70 active:opacity-50 transition-opacity"
			style={{ width: size, height: size }}
			aria-label="Remove player"
		>
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Black circle background */}
				<circle cx="12" cy="12" r="8" fill="#000000" />
				
				{/* White X on top */}
				<path
					d="M15.707 9.707l-1.414-1.414L12 10.586 9.707 8.293 8.293 9.707 10.586 12l-2.293 2.293 1.414 1.414L12 13.414l2.293 2.293 1.414-1.414L13.414 12l2.293-2.293z"
					fill="#FFFFFF"
				/>
			</svg>
		</button>
	)
}

