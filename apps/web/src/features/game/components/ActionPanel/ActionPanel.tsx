import { useState } from 'react'
import { ActionButtons } from './ActionButtons'
import { BetSlider } from './BetSlider'

interface ActionPanelProps {
	toCall: number
	minRaise: number
	maxRaise: number
	pot: number
	canRaise: boolean
	isLoading: boolean
	onFold: () => void
	onCall: () => void
	onRaise: (amount: number) => void
}

/**
 * Container for action buttons and bet slider.
 * Manages the raise slider state internally.
 */
export function ActionPanel({
	toCall,
	minRaise,
	maxRaise,
	pot,
	canRaise,
	isLoading,
	onFold,
	onCall,
	onRaise,
}: ActionPanelProps) {
	const [showSlider, setShowSlider] = useState(false)
	const [raiseAmount, setRaiseAmount] = useState(minRaise)

	const handleRaiseClick = () => {
		if (showSlider) {
			onRaise(raiseAmount)
			setShowSlider(false)
		} else {
			setRaiseAmount(minRaise)
			setShowSlider(true)
		}
	}

	const handleFold = () => {
		onFold()
		setShowSlider(false)
	}

	const handleCall = () => {
		onCall()
		setShowSlider(false)
	}

	const handleCancel = () => {
		setShowSlider(false)
	}

	return (
		<div className="mt-2 flex flex-col items-center gap-2">
			{showSlider && (
				<BetSlider
					value={raiseAmount}
					min={minRaise}
					max={maxRaise}
					pot={pot}
					onChange={setRaiseAmount}
					onCancel={handleCancel}
				/>
			)}

			<ActionButtons
				toCall={toCall}
				canRaise={canRaise}
				isRaiseMode={showSlider}
				isLoading={isLoading}
				onFold={handleFold}
				onCall={handleCall}
				onRaiseClick={handleRaiseClick}
			/>
		</div>
	)
}

