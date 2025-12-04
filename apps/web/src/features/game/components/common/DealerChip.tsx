/**
 * Dealer chip component - white circle with "D" letter.
 * Used for visual dealer position indicator.
 */

interface DealerChipProps {
	size?: number
	className?: string
	style?: React.CSSProperties
}

export function DealerChip({
	size = 60,
	className = '',
	style
}: DealerChipProps) {
	const fontSize = Math.round(size * 0.55)

	return (
		<div
			className={`bg-white border border-black rounded-full relative ${className}`}
			style={{
				width: size,
				height: size,
				...style
			}}
		>
			{/* Use absolute positioning to visually center the D */}
			<span
				className="absolute text-black font-normal"
				style={{
					fontSize,
					fontFamily: 'SF Compact Rounded, sans-serif',
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -52%)',
				}}
			>
				D
			</span>
		</div>
	)
}

