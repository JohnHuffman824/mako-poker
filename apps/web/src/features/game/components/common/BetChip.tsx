import { cn } from '@/lib/utils'

interface BetChipProps {
	amount: number
	isHero?: boolean
	className?: string
}

/**
 * Displays a player's current bet as a chip indicator.
 */
export function BetChip({ amount, isHero = false, className }: BetChipProps) {
	if (amount <= 0) return null

	return (
		<div
			className={cn(
				'text-white text-xs px-2 py-1 rounded font-semibold shadow',
				isHero ? 'bg-emerald-500' : 'bg-amber-500',
				className
			)}
		>
			{amount.toFixed(1)} BB
		</div>
	)
}

