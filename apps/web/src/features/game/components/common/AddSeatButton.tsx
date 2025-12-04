/**
 * Plus button to add a player to an empty seat.
 * Matches Figma design with circular teal background.
 */

interface AddSeatButtonProps {
	onClick: () => void
	size?: number
}

const BUTTON_COLORS = {
	background: 'rgba(69, 140, 176, 0.8)',
}

export function AddSeatButton({ onClick, size = 50 }: AddSeatButtonProps) {
	const fontSize = Math.round(size * 0.7)

	return (
		<button
			onClick={onClick}
			className="relative rounded-full
								 hover:brightness-110 active:brightness-90 transition-all
								 cursor-pointer"
			style={{
				width: size,
				height: size,
				backgroundColor: BUTTON_COLORS.background,
			}}
			aria-label="Add player to seat"
		>
			{/* Use absolute positioning to visually center the + symbol */}
			<span
				className="absolute text-white font-normal"
				style={{
					fontSize,
					fontFamily: 'SF Compact Rounded, sans-serif',
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -54%)',
				}}
			>
				+
			</span>
		</button>
	)
}

