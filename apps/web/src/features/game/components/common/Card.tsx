import {
	PlayingCard,
	CardBack,
	CardPlaceholder as NewCardPlaceholder
} from './PlayingCard'
import { ColorScheme, Rank, Suit } from '../../constants/cards'

export interface CardData {
	rank: Rank
	suit: Suit
}

interface CardProps {
	card?: CardData | null
	size?: 'sm' | 'md' | 'lg' | 'hero'
	faceDown?: boolean
	colorScheme?: ColorScheme
	className?: string
}

/**
 * Playing card component - delegates to PlayingCard with Figma design.
 * Supports both dual-tone and quad-tone color schemes.
 */
export function Card({ 
	card, 
	size = 'sm', 
	faceDown = false,
	colorScheme = 'quad-tone',
	className 
}: CardProps) {
	if (faceDown || !card) {
		return <CardBack size={size} className={className} />
	}

	return (
		<PlayingCard
			rank={card.rank}
			suit={card.suit}
			size={size}
			colorScheme={colorScheme}
			className={className}
		/>
	)
}

/**
 * Empty card placeholder with dashed border.
 */
export function CardPlaceholder({ 
	size = 'sm',
	className 
}: { 
	size?: 'sm' | 'md' | 'lg' | 'hero'
	className?: string 
}) {
	return <NewCardPlaceholder size={size} className={className} />
}
