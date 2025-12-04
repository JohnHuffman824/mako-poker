import { cn } from '@/lib/utils'
import {
	Suit,
	Rank,
	ColorScheme,
	getCardColor,
	SUIT_ICONS,
	CARD_BACK_IMAGE,
} from '../../constants/cards'

export type CardSize = 'sm' | 'md' | 'lg' | 'community' | 'hero'

interface PlayingCardProps {
	rank: Rank
	suit: Suit
	colorScheme?: ColorScheme
	size?: CardSize
	faceDown?: boolean
	className?: string
}

// Size configurations
const SIZE_CONFIG: Record<CardSize, {
	card: string
	cardWidth: number
	rankSize: string
	cornerPadding: string
}> = {
	sm: {
		card: 'w-[50px] h-[70px]',
		cardWidth: 50,
		rankSize: 'text-[22px]',
		cornerPadding: '4px',
	},
	md: {
		card: 'w-[70px] h-[98px]',
		cardWidth: 70,
		rankSize: 'text-[32px]',
		cornerPadding: '6px',
	},
	lg: {
		card: 'w-[85px] h-[119px]',
		cardWidth: 85,
		rankSize: 'text-[43px]',
		cornerPadding: '7px',
	},
	community: {
		card: 'w-[60px] h-[84px]',
		cardWidth: 60,
		rankSize: 'text-[32px]',
		cornerPadding: '5px',
	},
	hero: {
		card: 'w-[100px] h-[140px]',
		cardWidth: 100,
		rankSize: 'text-[54px]',
		cornerPadding: '8px',
	},
}

/**
 * Calculate suit icon dimensions with consistent visual sizing.
 * 
 * All suits are scaled to the same TARGET HEIGHT for visual consistency.
 * Width varies based on aspect ratio:
 * - Spades/diamonds: 40:50 aspect ratio (narrower)
 * - Hearts/clubs: 50:50 aspect ratio (square)
 * 
 * This ensures all suits appear the same size visually.
 */
function getSuitDimensions(
	suit: Suit, 
	size: CardSize
): { width: number; height: number } {
	const config = SIZE_CONFIG[size]
	
	// Target height as percentage of card width for consistent sizing
	const targetHeight = config.cardWidth * 0.4
	
	const narrowSuits: Suit[] = ['spades', 'diamonds']
	const isNarrow = narrowSuits.includes(suit)
	
	// Base dimensions from SVG viewBox - all have 50px height
	const baseWidth = isNarrow ? 40 : 50
	const baseHeight = 50
	
	// Scale uniformly by height for consistent visual size across all suits
	const scaleFactor = targetHeight / baseHeight
	
	const width = Math.floor(baseWidth * scaleFactor)
	const height = Math.floor(baseHeight * scaleFactor)
	
	return { width, height }
}

/**
 * Configurable playing card component supporting dual-tone and quad-tone 
 * color schemes. Renders rank and suit based on provided props.
 */
export function PlayingCard({
	rank,
	suit,
	colorScheme = 'quad-tone',
	size = 'hero',
	faceDown = false,
	className,
}: PlayingCardProps) {
	if (faceDown) {
		return <CardBack size={size} className={className} />
	}

	return (
		<CardFace
			rank={rank}
			suit={suit}
			colorScheme={colorScheme}
			size={size}
			className={className}
		/>
	)
}

interface CardFaceProps {
	rank: Rank
	suit: Suit
	colorScheme: ColorScheme
	size: CardSize
	className?: string
}

/**
 * Face-up card with rank and suit.
 * Rank: top-left corner with equal padding from top/left edges.
 * Suit: bottom-right corner with equal padding from bottom/right edges.
 */
function CardFace({
	rank,
	suit,
	colorScheme,
	size,
	className,
}: CardFaceProps) {
	const config = SIZE_CONFIG[size]
	const bgColor = getCardColor(suit, colorScheme)
	const suitIcon = SUIT_ICONS[suit]
	const suitDimensions = getSuitDimensions(suit, size)

	return (
		<div
			className={cn(
				config.card,
				'relative rounded-[10px] border border-black border-solid',
				'shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),' +
				'0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
				className
			)}
			style={{ backgroundColor: bgColor }}
		>
			{/* Rank - top-left corner with equal padding */}
			<div
				className="absolute"
				style={{
					top: config.cornerPadding,
					left: config.cornerPadding,
				}}
			>
				<span
					className={cn(
						config.rankSize,
						'font-sf-compact font-normal text-white leading-none'
					)}
				>
					{rank}
				</span>
			</div>

			{/* Suit icon - bottom-right corner with equal padding */}
			<div
				className="absolute"
				style={{
					bottom: config.cornerPadding,
					right: config.cornerPadding,
					width: suitDimensions.width,
					height: suitDimensions.height,
				}}
			>
				<img
					src={suitIcon}
					alt={suit}
					className="w-full h-full"
				/>
			</div>
		</div>
	)
}

interface CardBackProps {
	size: CardSize
	className?: string
}

/**
 * Face-down card back with texture pattern.
 */
function CardBack({ size, className }: CardBackProps) {
	const config = SIZE_CONFIG[size]

	return (
		<div
			className={cn(
				config.card,
				'relative rounded-[10px] border border-black border-solid' +
				' overflow-hidden',
				'shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),' +
				'0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
				className
			)}
		>
			<img
				src={CARD_BACK_IMAGE}
				alt="Card back"
				className="absolute inset-0 w-full h-full object-cover"
			/>
		</div>
	)
}

/**
 * Empty card placeholder with dashed border.
 */
export function CardPlaceholder({
	size = 'sm',
	className,
}: {
	size?: CardSize
	className?: string
}) {
	const config = SIZE_CONFIG[size]

	return (
		<div
			className={cn(
				config.card,
				'bg-gray-700/50 rounded-[10px]',
				'border-2 border-dashed border-gray-500',
				className
			)}
		/>
	)
}

export { CardBack }

