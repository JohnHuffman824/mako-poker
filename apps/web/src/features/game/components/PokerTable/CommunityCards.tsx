import { PlayingCard } from '../common'

interface CardData {
	rank: string
	suit: string
	display: string
}

interface CommunityCardsProps {
	cards: CardData[]
}

/**
 * Displays community cards (flop/turn/river) in center of table.
 * Cards are shown in horizontal row with 8px gap between them.
 * Uses 'community' size (60x84px) for cards.
 */
export function CommunityCards({ cards }: CommunityCardsProps) {
	if (cards.length === 0) {
		return null
	}

	return (
		<div 
			className="flex items-center justify-center"
			style={{ gap: 8 }}
		>
			{cards.map((card, index) => (
				<PlayingCard
					key={`${card.rank}${card.suit}-${index}`}
					rank={card.rank}
					suit={card.suit}
					size="community"
					colorScheme="quad-tone"
				/>
			))}
		</div>
	)
}

