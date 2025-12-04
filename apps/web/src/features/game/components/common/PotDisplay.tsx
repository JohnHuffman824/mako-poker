interface PotDisplayProps {
  pot: number
}

/**
 * Displays the current pot size.
 * Positioned by parent container.
 * Uses SF Compact Rounded font matching game design.
 */
export function PotDisplay({ pot }: PotDisplayProps) {
  if (pot == 0) return null

  return (
    <div
      className="bg-black/60 backdrop-blur-sm rounded-lg
                 text-white font-sf-compact shadow-lg whitespace-nowrap"
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 6,
        paddingBottom: 6,
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      <span className="text-amber-400">Pot:</span>{' '}
      <span>{pot.toFixed(1)} BB</span>
    </div>
  )
}

