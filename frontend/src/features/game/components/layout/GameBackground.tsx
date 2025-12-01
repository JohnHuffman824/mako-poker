/**
 * Game page background with Mako-themed blue radial gradient.
 * Exact match to Figma design specifications.
 */
export function GameBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Main radial gradient background - exact Figma colors */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 50% 50% at 50% 50%,
            #B6E7FF 9%,
            #458CB0 100%
          )`
        }}
      />
    </div>
  )
}
