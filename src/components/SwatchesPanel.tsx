import { useEffect, useState } from 'react'
import { PanelHeader } from './PanelHeader'
import { ColorPicker } from './ColorPicker'
import { useDocStore } from '../store/documentStore'
import type { Paint } from '../style/paint'
import { normalizeHex } from '../color/colorMath'

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

/** In-app picker + explicit Add — never opens the macOS Color Panel. */
function AddSwatchControls({ seed }: { seed: string }) {
  const [draft, setDraft] = useState(seed)

  useEffect(() => {
    setDraft(seed)
  }, [seed])

  return (
    <div className="swatch-add-row">
      <ColorPicker
        value={draft}
        onChange={setDraft}
        aria-label="Pick a color"
        title="Pick a color"
        size="sm"
      />
      <button
        type="button"
        className="swatch-add__commit"
        title="Add color to Penultimate swatches"
        aria-label="Add color to swatches"
        onClick={() => useDocStore.getState().addSwatch(draft)}
      >
        Add
      </button>
    </div>
  )
}

function swatchSeedColor(fill: Paint, stroke: Paint): string {
  if (fill.type === 'solid') return normalizeHex(fill.color) ?? '#808080'
  if (fill.type === 'linear' || fill.type === 'radial') {
    return normalizeHex(fill.stops[0]?.color ?? '#ffffff') ?? '#ffffff'
  }
  if (stroke.type === 'solid') return normalizeHex(stroke.color) ?? '#000000'
  if (stroke.type === 'linear' || stroke.type === 'radial') {
    return normalizeHex(stroke.stops[0]?.color ?? '#000000') ?? '#000000'
  }
  return '#808080'
}
