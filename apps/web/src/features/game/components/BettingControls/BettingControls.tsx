import { useState, useEffect } from 'react'
import { formatBB } from '../../utils'

interface BettingControlsProps {
	toCall: number
	minRaise: number
	maxRaise: number
	pot: number
	isVisible: boolean
	isLoading: boolean
	heroStack: number
	bigBlind: number
	onFold: () => void
	onCall: () => void
	onRaise: (amount: number) => void
}

/**
 * Bottom betting controls bar - responsive design.
 * Positioned at the bottom of viewport with full width.
 */
export function BettingControls({
	toCall,
	minRaise,
	maxRaise,
	isVisible,
	isLoading,
	heroStack,
	bigBlind,
	onFold,
	onCall,
	onRaise,
}: BettingControlsProps) {
	const [raiseAmount, setRaiseAmount] = useState(minRaise)
	const [inputValue, setInputValue] = useState(
		formatBB(minRaise / bigBlind)
	)
	const isCheck = toCall == 0

	const sliderMin = minRaise
	const sliderMax = Math.min(maxRaise, heroStack)

	/**
	 * Clamps a value between slider min and max bounds
	 */
	const clampValue = (value: number) => Math.max(
		sliderMin,
		Math.min(sliderMax, value)
	)

	/**
	 * Converts chip amount to BB for display
	 */
	const chipsToBB = (chips: number): number => {
		return Math.round((chips / bigBlind) * 10) / 10
	}

	/**
	 * Converts BB input to chip amount
	 */
	const bbToChips = (bb: number): number => {
		return bb * bigBlind
	}

	/**
	 * Reset raise amount when minRaise changes (new betting round)
	 */
	useEffect(() => {
		setRaiseAmount(minRaise)
		setInputValue(formatBB(chipsToBB(minRaise)))
	}, [minRaise, bigBlind])

	/**
	 * Updates both the slider and input when slider changes
	 */
	const handleSliderChange = (value: number) => {
		setRaiseAmount(value)
		setInputValue(formatBB(chipsToBB(value)))
	}

	/**
	 * Handles input field changes with validation
	 */
	const handleInputChange = (value: string) => {
		setInputValue(value)
		const bbValue = parseFloat(value)
		if (!isNaN(bbValue)) {
			const chipValue = bbToChips(bbValue)
			setRaiseAmount(clampValue(chipValue))
		}
	}

	/**
	 * Syncs input field on blur to ensure valid value
	 */
	const handleInputBlur = () => {
		const bbValue = parseFloat(inputValue)
		if (isNaN(bbValue)) {
			setInputValue(formatBB(chipsToBB(raiseAmount)))
		} else {
			const chipValue = bbToChips(bbValue)
			const clampedValue = clampValue(chipValue)
			setRaiseAmount(clampedValue)
			setInputValue(formatBB(chipsToBB(clampedValue)))
		}
	}

	if (!isVisible) {
		return <BottomOverlay />
	}

	const handleRaise = () => {
		onRaise(raiseAmount) // Send chips to backend
	}

	// Convert toCall chips to BB for display
	const toCallBB = Math.round((toCall / bigBlind) * 10) / 10

	return (
		<div
			className="w-full h-36 left-0 bottom-0 absolute inline-flex
								 flex-col justify-center items-center gap-4"
		>
			{/* Background overlay */}
			<div
				className="w-full h-36 left-0 top-0 absolute
									 bg-gray-600/40"
			/>

			{/* Slider row */}
			<div
				className="w-[768px] h-10 inline-flex justify-center
									 items-center gap-4 z-10"
			>
				{/* Range slider track */}
				<div
					className="w-[529px] h-2 relative bg-gray-600/50
										 rounded-[10px]"
				>
					<input
						type="range"
						min={sliderMin}
						max={sliderMax}
						step={0.5}
						value={raiseAmount}
						onChange={(e) =>
							handleSliderChange(parseFloat(e.target.value))
						}
						disabled={isLoading}
						className="absolute inset-0 w-full h-full opacity-0
											 cursor-pointer"
					/>
					{/* Fill indicator */}
					<div
						className="absolute left-0 top-0 h-2 bg-white/60
											 rounded-[10px]"
						style={{
							width: sliderMax > sliderMin
								? `${((raiseAmount - sliderMin) / 
									(sliderMax - sliderMin)) * 100}%`
								: '0%'
						}}
					/>
				</div>

				{/* BB counter */}
				<div
					className="w-24 h-10 px-3 bg-gray-700/60 rounded-[10px]
										 flex justify-start items-center gap-2"
				>
					<div
						className="flex-1 h-6 flex justify-start items-center
									 overflow-hidden"
					>
						<input
							type="text"
							value={inputValue}
							onChange={(e) => handleInputChange(e.target.value)}
							onBlur={handleInputBlur}
							disabled={isLoading}
							className="w-full text-center bg-transparent
												 text-white text-base font-normal
												 font-sf-compact leading-6 outline-none
												 disabled:opacity-50"
						/>
					</div>
					<div className="w-5 h-6 relative">
					<div
						className="left-0 top-[-0.50px] absolute justify-start
											 text-gray-300 text-xl font-normal font-sf-compact
											 leading-6"
					>
						BB
					</div>
					</div>
				</div>
			</div>

			{/* Action buttons row */}
			<div
				className="w-80 h-11 inline-flex justify-center
									 items-start gap-3 z-10"
			>
				{/* Fold button */}
				<button
					onClick={onFold}
					disabled={isLoading}
					className="w-24 h-11 bg-red-400 rounded-[10px]
										 disabled:opacity-50 disabled:cursor-not-allowed
										 hover:brightness-110 active:brightness-90
										 transition-all
										 flex items-center justify-center
										 text-gray-800 text-xl font-normal
										 font-sf-compact leading-6"
				>
					Fold
				</button>

				{/* Check/Call button */}
				<button
					onClick={onCall}
					disabled={isLoading}
					className="w-28 h-11 bg-blue-400 rounded-[10px]
										 disabled:opacity-50 disabled:cursor-not-allowed
										 hover:brightness-110 active:brightness-90
										 transition-all
										 flex items-center justify-center
										 text-gray-800 text-xl font-normal
										 font-sf-compact leading-6"
				>
					{isCheck ? 'Check' : `Call ${formatBB(toCallBB)}`}
				</button>

				{/* Raise button */}
				<button
					onClick={handleRaise}
					disabled={isLoading}
					className="w-20 h-11 bg-green-400 rounded-[10px]
										 disabled:opacity-50 disabled:cursor-not-allowed
										 hover:brightness-110 active:brightness-90
										 transition-all
										 flex items-center justify-center
										 text-gray-800 text-xl font-normal
										 font-sf-compact leading-6"
				>
					{formatBB(chipsToBB(raiseAmount))}x
				</button>
			</div>
		</div>
	)
}

/**
 * Bottom overlay when no hand in progress.
 */
function BottomOverlay() {
	return (
		<div className="w-full h-36 left-0 bottom-0 absolute">
			<div className="w-full h-36 left-0 top-0 absolute bg-gray-600/40" />
		</div>
	)
}
