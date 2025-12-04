interface HandInfoProps {
	street: string
	smallBlind: number
	bigBlind: number
}

/**
 * Footer bar showing current street and blinds info.
 */
export function HandInfo({ street, smallBlind, bigBlind }: HandInfoProps) {
	return (
		<div className="absolute bottom-4 left-1/2 -translate-x-1/2
										bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2
										text-white text-sm">
			<span className="text-gray-400">Street:</span>{' '}
			<span className="font-medium capitalize">{street}</span>
			<span className="mx-3 text-gray-600">|</span>
			<span className="text-gray-400">Blinds:</span>{' '}
			<span className="font-medium">{smallBlind}/{bigBlind} BB</span>
		</div>
	)
}

