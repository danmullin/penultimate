import { useEffect, useState } from 'react'
import { PanelHeader } from './PanelHeader'
import { useDocStore } from '../store/documentStore'
import type { Paint } from '../style/paint'

/** Document swatch library — separate from Appearance. */
export function SwatchesPanel() {
  const doc = useDocStore((s) => s.doc)
  const selectedIds = useDocStore((s) => s.selectedIds)
  const [folded, setFolded] = useState(false)

  const primary = selectedIds.map((id) => doc.nodes[id]).filter(Boolean)[0]
  const seed = primary
    ? swatchSeedColor(primary.style.fill, primary.style.stroke)
    : '#808080'

  return (
    <aside className={`swatches-panel${folded ? ' is-collapsed' : ''}`}>
      <PanelHeader
        title={`Swatches (${doc.swatches.length})`}
        collapsed={folded}
        onToggle={() => setFolded((v) => !v)}
      />
      {!folded && (
        <div className="swatches-body">
          <div className="swatch-library swatch-library--compact">
            <div className="swatch-library__head">
              <span>Click fill · Shift+click stroke</span>
              <AddSwatchControls seed={seed} />
            </div>
            <div className="swatch-library__grid">
              {doc.swatches.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="swatch-chip"
                  style={{ background: c }}
                  title={`${c} — click fill, Shift+click stroke · right-click remove`}
                  onClick={(e) => {
                    useDocStore.getState().applySwatch(c, e.shiftKey ? 'stroke' : 'fill')
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    useDocStore.getState().removeSwatch(c)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

/**
 * Native color well only chooses a color. Penultimate owns "add to library"
 * via an explicit Add button — we can't hook macOS Color Panel swatch-add.
 */
function AddSwatchControls({ seed }: { seed: string }) {
  const [draft, setDraft] = useState(seed)

  useEffect(() => {
    setDraft(seed)
  }, [seed])

  const add = () => {
    useDocStore.getState().addSwatch(draft)
  }

  return (
    <div className="swatch-add-row">
      <label className="swatch-add swatch-add--well" title="Pick a color">
        <span className="swatch-add__well" style={{ background: draft }} aria-hidden />
        <input
          type="color"
          aria-label="Pick a color"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="swatch-add__commit"
        title="Add color to Penultimate swatches"
        aria-label="Add color to swatches"
        onClick={add}
      >
        Add
      </button>
    </div>
  )
}

function swatchSeedColor(fill: Paint, stroke: Paint): string {
  if (fill.type === 'solid') return toHex6(fill.color)
  if (fill.type === 'linear' || fill.type === 'radial') {
    return toHex6(fill.stops[0]?.color ?? '#ffffff')
  }
  if (stroke.type === 'solid') return toHex6(stroke.color)
  if (stroke.type === 'linear' || stroke.type === 'radial') {
    return toHex6(stroke.stops[0]?.color ?? '#000000')
  }
  return '#808080'
}

function toHex6(color: string): string {
  const c = color.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(c)) return c
  if (/^#[0-9a-f]{3}$/.test(c)) {
    const [, r, g, b] = c
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#808080'
}
