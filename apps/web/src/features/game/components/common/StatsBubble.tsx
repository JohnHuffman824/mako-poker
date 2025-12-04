import { cn } from '@/lib/utils'

interface StatsBubbleProps {
	stack: number
	position: string
	lastAction?: string | null
	isActive?: boolean
	isHero?: boolean
	className?: string
}

/**
 * Player stats bubble - exact Figma design.
 * Red/orange radial gradient background with shadow.
 */
export function StatsBubble({
	stack,
	position,
	lastAction,
	isActive = false,
	isHero = false,
	className,
}: StatsBubbleProps) {
	return (
		<div
			className={cn(
				'p-2.5 rounded-2xl outline outline-1 outline-offset-[-1px] outline-black',
				'inline-flex justify-center items-center gap-2.5',
				isActive && 'ring-2 ring-yellow-400',
				isActive && !isHero && 'animate-pulse',
				className
			)}
			style={{
				background: `radial-gradient(
					ellipse 50% 50% at 50% 50%,
					#ED583E 51%,
					#CB4933 100%
				)`,
				boxShadow: '5px 5px 4px 0px rgba(0,0,0,0.35)'
			}}
		>
			<div
				className="text-center justify-center text-black text-3xl
									 font-normal font-['SF_Compact_Rounded']"
			>
				{stack.toFixed(0)} BB
				<br />
				{position}
				{lastAction && ` • ${lastAction}`}
			</div>
		</div>
	)
}
