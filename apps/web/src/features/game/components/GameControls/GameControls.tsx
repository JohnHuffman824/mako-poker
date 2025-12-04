import { PlayerCountControl } from './PlayerCountControl'
import { AutoDealToggle } from './AutoDealToggle'
import { BlindSizeControl } from './BlindSizeControl'

interface GameControlsProps {
	playerCount: number
	autoDeal: boolean
	blindSize: number
	isHandInProgress: boolean
	isLoading: boolean
	onPlayerCountChange: (count: number) => void
	onAutoDealChange: (enabled: boolean) => void
	onBlindSizeChange: (size: number) => void
}

/**
 * Game controls panel - scaled to fit design viewport.
 * Uses design coordinates (1440x900) with 70% scale.
 */
export function GameControls({
	playerCount,
	autoDeal,
	blindSize,
	isHandInProgress,
	isLoading,
	onPlayerCountChange,
	onAutoDealChange,
	onBlindSizeChange,
}: GameControlsProps) {
	const controlsDisabled = isHandInProgress || isLoading

	return (
		<div
			className="absolute flex flex-col justify-start items-start z-20"
			style={{
				left: 20,
				top: 60,
				gap: 8,
				transform: 'scale(0.7)',
				transformOrigin: 'top left',
			}}
		>
			<PlayerCountControl
				count={playerCount}
				onChange={onPlayerCountChange}
				disabled={controlsDisabled}
			/>

				<AutoDealToggle
					enabled={autoDeal}
					onChange={onAutoDealChange}
				/>

			<BlindSizeControl
				value={blindSize}
				onChange={onBlindSizeChange}
					disabled={controlsDisabled}
				/>
		</div>
	)
}
