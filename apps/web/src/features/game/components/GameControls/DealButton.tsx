import { cn } from '@/lib/utils'

interface DealButtonProps {
	onClick: () => void
	disabled: boolean
	isLoading: boolean
}

/**
 * Button to deal a new hand.
 */
export function DealButton({ onClick, disabled, isLoading }: DealButtonProps) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'px-6 py-3 rounded-lg font-bold text-white transition-all',
				'shadow-lg hover:shadow-xl',
				'bg-amber-600 hover:bg-amber-500 active:bg-amber-700',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			)}
		>
			{isLoading ? 'Dealing...' : 'Deal Hand'}
		</button>
	)
}

