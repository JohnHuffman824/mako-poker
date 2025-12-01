import { cn } from '@/lib/utils'

interface ActionButtonsProps {
  toCall: number
  canRaise: boolean
  isRaiseMode: boolean
  isLoading: boolean
  onFold: () => void
  onCall: () => void
  onRaiseClick: () => void
}

/**
 * Action buttons for fold, call/check, and raise.
 * Pure presentational component.
 */
export function ActionButtons({
  toCall,
  canRaise,
  isRaiseMode,
  isLoading,
  onFold,
  onCall,
  onRaiseClick,
}: ActionButtonsProps) {
  const isCheck = toCall == 0

  return (
    <div className="flex gap-2">
      <FoldButton onClick={onFold} disabled={isLoading} />
      <CallButton
        isCheck={isCheck}
        toCall={toCall}
        onClick={onCall}
        disabled={isLoading}
      />
      {canRaise && (
        <RaiseButton
          isActive={isRaiseMode}
          onClick={onRaiseClick}
          disabled={isLoading}
        />
      )}
    </div>
  )
}

function FoldButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-5 py-3 rounded-lg font-bold text-white transition-all',
        'bg-red-600 hover:bg-red-500 active:bg-red-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-lg hover:shadow-xl',
        'min-w-[80px]'
      )}
    >
      FOLD
    </button>
  )
}

function CallButton({
  isCheck,
  toCall,
  onClick,
  disabled,
}: {
  isCheck: boolean
  toCall: number
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-5 py-3 rounded-lg font-bold text-white transition-all',
        'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-lg hover:shadow-xl',
        'min-w-[100px]'
      )}
    >
      {isCheck ? 'CHECK' : `CALL ${toCall.toFixed(1)}`}
    </button>
  )
}

function RaiseButton({
  isActive,
  onClick,
  disabled,
}: {
  isActive: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-5 py-3 rounded-lg font-bold text-white transition-all',
        'shadow-lg hover:shadow-xl',
        'min-w-[80px]',
        isActive
          ? 'bg-amber-500 hover:bg-amber-400'
          : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {isActive ? 'CONFIRM' : 'RAISE'}
    </button>
  )
}

