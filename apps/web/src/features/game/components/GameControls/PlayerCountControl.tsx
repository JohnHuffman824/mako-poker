import { cn } from '@/lib/utils'
import { GAME_DEFAULTS } from '../../constants/game.constants'

interface PlayerCountControlProps {
  count: number
  onChange: (count: number) => void
  disabled: boolean
}

/**
 * Player count control - exact Figma design.
 * Teal background with +/- circle buttons.
 */
export function PlayerCountControl({
  count,
  onChange,
  disabled,
}: PlayerCountControlProps) {
  const canDecrease = count > GAME_DEFAULTS.MIN_PLAYERS
  const canIncrease = count < GAME_DEFAULTS.MAX_PLAYERS

  return (
    <div className="self-stretch h-[53px] relative w-full">
      {/* Background */}
      <div
        className="w-[281px] h-[53px] left-0 top-0 absolute 
                   rounded-[10px]"
        style={{ backgroundColor: 'rgba(69, 140, 176, 0.8)' }}
      />

      {/* Controls */}
      <div
        className="left-[13px] top-0 absolute flex 
                   items-center gap-[10px]"
      >
        <div
          className="w-[138px] h-[53px] flex flex-col justify-center
                     text-white text-2xl font-normal leading-[0]"
          style={{ fontFamily: 'SF Compact Rounded, sans-serif' }}
        >
          <p className="leading-normal">Player Count</p>
        </div>

        <CircleButton
          onClick={() => onChange(count - 1)}
          disabled={disabled || !canDecrease}
        >
          -
        </CircleButton>

        <CircleButton
          onClick={() => onChange(count + 1)}
          disabled={disabled || !canIncrease}
        >
          +
        </CircleButton>

        <div
          className="w-[30px] h-[40px] text-center flex 
                     flex-col justify-center text-white 
                     text-[30px] font-normal leading-[0]"
          style={{ fontFamily: 'SF Compact Rounded, sans-serif' }}
        >
          <p className="leading-normal">{count}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Circle button with background circle and +/- symbol
 */
function CircleButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  const isPlus = children === '+'

  return (
    <div className="w-[30px] h-[30px] relative shrink-0">
      {/* Circle background */}
      <div className="absolute left-0 w-[30px] h-[30px] top-[1px]">
        <div
          className="w-full h-full rounded-full"
          style={{ backgroundColor: 'rgba(102, 102, 102, 0.4)' }}
        />
      </div>
      
      {/* Button with symbol */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'absolute left-[15px] top-[15px] w-[30px] h-[30px]',
          'flex flex-col justify-center items-center',
          'text-white font-normal leading-[0] text-center',
          'transform -translate-x-1/2 -translate-y-1/2',
          isPlus ? 'text-[30px]' : 'text-[35px]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'hover:brightness-110 transition-all'
        )}
        style={{ fontFamily: 'Heebo, sans-serif' }}
      >
        <p className="leading-normal">{children}</p>
      </button>
    </div>
  )
}
