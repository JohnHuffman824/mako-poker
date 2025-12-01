import { useState } from 'react'

interface BettingControlsProps {
  toCall: number
  minRaise: number
  maxRaise: number
  pot: number
  isVisible: boolean
  isLoading: boolean
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
  onFold,
  onCall,
  onRaise,
}: BettingControlsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise)
  const isCheck = toCall == 0

  if (!isVisible) {
    return <BottomOverlay />
  }

  const handleRaise = () => {
    onRaise(raiseAmount)
  }

  return (
    <div
      className="w-full h-36 left-0 bottom-0 absolute
                 inline-flex flex-col justify-center items-center gap-4"
    >
      {/* Background overlay */}
      <div className="w-full h-36 left-0 top-0 absolute bg-gray-600/40" />

      {/* Slider row */}
      <div className="w-[768px] h-10 inline-flex justify-center items-center gap-4 z-10">
        {/* Range slider track */}
        <div className="w-[529px] h-2 relative bg-gray-600/50 rounded-[10px]">
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={0.5}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(parseFloat(e.target.value))}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Fill indicator */}
          <div
            className="absolute left-0 top-0 h-2 bg-white/60
                       rounded-[10px]"
            style={{
              width: 
                `${((raiseAmount - minRaise) / 
                (maxRaise - minRaise)) * 100}%`
            }}
          />
        </div>

        {/* BB counter */}
        <div
          className="w-24 h-10 px-3 bg-gray-700/60 rounded-[10px]
                     flex justify-start items-center gap-2"
        >
          <div className="flex-1 h-6 flex justify-start items-center overflow-hidden">
            <div
              className="text-center justify-start text-white text-base
                         font-normal font-sf-compact leading-6"
            >
              {raiseAmount.toFixed(0)}
            </div>
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
      <div className="w-80 h-11 inline-flex justify-center items-start gap-3 z-10">
        {/* Fold button */}
        <button
          onClick={onFold}
          disabled={isLoading}
          className="w-24 h-11 relative bg-red-400 rounded-[10px]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:brightness-110 active:brightness-90
                     transition-all"
        >
          <div
            className="left-[30px] top-[9.50px] absolute text-center
                       justify-start text-gray-800 text-xl font-normal
                       font-sf-compact leading-6"
          >
            Fold
          </div>
        </button>

        {/* Check/Call button */}
        <button
          onClick={onCall}
          disabled={isLoading}
          className="w-28 h-11 relative bg-blue-400 rounded-[10px]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:brightness-110 active:brightness-90
                     transition-all"
        >
          <div
            className="left-[29px] top-[9.50px] absolute text-center
                       justify-start text-gray-800 text-xl font-normal
                       font-sf-compact leading-6"
          >
            {isCheck ? 'Check' : `Call ${toCall.toFixed(0)}`}
          </div>
        </button>

        {/* Raise button */}
        <button
          onClick={handleRaise}
          disabled={isLoading}
          className="w-20 h-11 relative bg-green-400 rounded-[10px]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:brightness-110 active:brightness-90
                     transition-all"
        >
          <div
            className="left-[31px] top-[9.50px] absolute text-center
                       justify-start text-gray-800 text-xl font-normal
                       font-sf-compact leading-6"
          >
            {raiseAmount.toFixed(0)}x
          </div>
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
