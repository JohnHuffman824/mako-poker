import { cn } from '@/lib/utils'

interface BetSliderProps {
  value: number
  min: number
  max: number
  pot: number
  onChange: (value: number) => void
  onCancel: () => void
}

/**
 * Slider for selecting raise/bet amount with preset buttons.
 * Pure presentational component.
 */
export function BetSlider({
  value,
  min,
  max,
  pot,
  onChange,
  onCancel,
}: BetSliderProps) {
  const presets = [
    { label: 'Min', value: min },
    { label: '½ Pot', value: Math.max(min, pot * 0.5) },
    { label: 'Pot', value: Math.max(min, pot) },
    { label: 'All-in', value: max },
  ]

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 
                    shadow-2xl border border-gray-700 min-w-[280px]">
      <ValueDisplay value={value} />

      <Slider
        value={value}
        min={min}
        max={max}
        onChange={onChange}
      />

      <RangeLabels min={min} max={max} />

      <PresetButtons
        presets={presets}
        currentValue={value}
        maxValue={max}
        onSelect={onChange}
      />

      <CancelButton onClick={onCancel} />
    </div>
  )
}

function ValueDisplay({ value }: { value: number }) {
  return (
    <div className="text-center mb-3">
      <span className="text-2xl font-bold text-white">
        {value.toFixed(1)}
      </span>
      <span className="text-gray-400 ml-1">BB</span>
    </div>
  )
}

function Slider({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={0.5}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none 
                 cursor-pointer accent-blue-500"
    />
  )
}

function RangeLabels({ min, max }: { min: number; max: number }) {
  return (
    <div className="flex justify-between text-xs text-gray-500 mt-1 mb-3">
      <span>{min.toFixed(1)} BB</span>
      <span>{max.toFixed(1)} BB</span>
    </div>
  )
}

function PresetButtons({
  presets,
  currentValue,
  maxValue,
  onSelect,
}: {
  presets: Array<{ label: string; value: number }>
  currentValue: number
  maxValue: number
  onSelect: (value: number) => void
}) {
  return (
    <div className="flex gap-2 mb-3">
      {presets.map((preset) => {
        const isSelected = Math.abs(currentValue - preset.value) < 0.1
        return (
          <button
            key={preset.label}
            onClick={() => onSelect(Math.min(preset.value, maxValue))}
            className={cn(
              'flex-1 py-1.5 px-2 rounded text-xs font-semibold transition-all',
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 rounded bg-gray-700 text-gray-300 
                 hover:bg-gray-600 text-sm transition-colors"
    >
      Cancel
    </button>
  )
}

