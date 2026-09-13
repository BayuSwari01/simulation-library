/**
 * Generated paper grain + vignette. Purely decorative, never interactive.
 * Both layers are tuned per theme by CSS variables in globals.css.
 */
export function PaperTexture() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="paper-grain absolute inset-0" />
      <div className="paper-vignette absolute inset-0" />
    </div>
  )
}
