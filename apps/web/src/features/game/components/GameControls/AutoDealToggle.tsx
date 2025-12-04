import { cn } from '@/lib/utils'

interface AutoDealToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

const TOGGLE_COLORS = {
  trackOn: '#0d6fff',
  trackOff: 'rgba(66, 81, 88, 0.4)',
  background: 'rgba(69, 140, 176, 0.8)',
  knobOff: '#111111',
  indicatorOff: '#c6c6c6'
}

/**
 * Auto-deal toggle switch matching Figma design.
 * OFF: dark knob on left, "O" indicator on right
 * ON: "|" indicator on left, white knob on right
 */
export function AutoDealToggle({ enabled, onChange }: AutoDealToggleProps) {
  return (
    <div className="self-stretch h-[53px] relative w-full">
      <div
        className="w-[281px] h-[53px] left-0 top-0 absolute rounded-[10px]"
        style={{ backgroundColor: TOGGLE_COLORS.background }}
      />

      <div className="left-[13px] top-0 absolute flex items-center gap-[10px]">
        <div
          className="w-[138px] h-[53px] flex flex-col justify-center
                     text-white text-2xl font-normal leading-[0]"
          style={{ fontFamily: 'SF Compact Rounded, sans-serif' }}
        >
          <p className="leading-normal">Auto Deal</p>
        </div>

        <button
          onClick={() => onChange(!enabled)}
          className="w-[70px] h-[28px] p-[2px] relative rounded-[1000px]
                     flex items-center overflow-hidden box-border"
          role="switch"
          aria-checked={enabled}
        >
          <div className="absolute left-0 top-[-0.5px] w-[70px] h-[28px]">
            <div
              className="absolute inset-0 transition-colors duration-200"
              style={{
                backgroundColor: enabled
                  ? TOGGLE_COLORS.trackOn
                  : TOGGLE_COLORS.trackOff
              }}
            />
          </div>

          {enabled ? (
            <>
              <OnIndicator />
              <Knob enabled={true} />
            </>
          ) : (
            <>
              <Knob enabled={false} />
              <OffIndicator />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Knob({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={cn(
        'w-[38px] h-full rounded-[100px] shrink-0 relative',
        'overflow-hidden transition-all duration-200',
        enabled ? 'bg-white' : ''
      )}
      style={{
        opacity: enabled ? 1 : 0.5,
        boxShadow: `
          0px 0px 1px 0px rgba(0, 0, 0, 0.05),
          0px 0px 4px 0px rgba(0, 0, 0, 0.05),
          0px 0px 44px 0px rgba(0, 0, 0, 0.1)
        `
      }}
    >
      {!enabled && (
        <>
          <div className="absolute inset-0 rounded-[100px]">
            <div
              className="absolute inset-0 rounded-[100px]"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            />
            <div
              className="absolute inset-0 rounded-[100px]"
              style={{ backgroundColor: TOGGLE_COLORS.knobOff }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              boxShadow: `
                1.75px 1.75px 1px -1px inset #ffffff,
                -1.75px -1.75px 2px -1px inset #ffffff,
                0px 0px 1px 0.25px inset rgba(255, 255, 255, 0.1)
              `
            }}
          />
        </>
      )}
    </div>
  )
}

function OnIndicator() {
  return (
    <div
      className="flex-1 flex items-center justify-center
                 gap-[10px] px-[4px] py-[5px] min-w-0
                 min-h-0 box-border relative"
    >
      <div className="w-[2px] h-[10px] rounded-[100px] bg-white shrink-0" />
    </div>
  )
}

function OffIndicator() {
  return (
    <div
      className="flex-1 flex items-center justify-center
                 gap-[10px] px-[4px] py-[5px] min-w-0
                 min-h-0 box-border relative opacity-50"
    >
      <div
        className="w-[6px] h-[6px] rounded-[100px] border-[1.5px] shrink-0"
        style={{ borderColor: TOGGLE_COLORS.indicatorOff }}
      />
    </div>
  )
}
