import { useEffect, useRef, useState } from 'react'
import { PanelHeader } from './PanelHeader'
import { ColorPicker } from './ColorPicker'
import { useColorPickerSession } from '../hooks/useColorPickerSession'
import { useDocStore } from '../store/documentStore'
import { paintSolid, type Paint } from '../style/paint'
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

/** Well opens the picker; Add lives inside so you can keep picking. */
function AddSwatchControls({ seed }: { seed: string }) {
  const [draft, setDraft] = useState(seed)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const session = useColorPickerSession()
  /** Color when the popover opened — Cancel restores the well to this. */
  const openHexRef = useRef(seed)
  /** Selection at open — live preview keeps targeting these even if focus moves. */
  const targetIdsRef = useRef<string[]>([])

  useEffect(() => {
    setDraft(seed)
  }, [seed])

  const preview = (hex: string) => {
    setDraft(hex)
    const store = useDocStore.getState()
    const ids =
      targetIdsRef.current.length > 0 ? targetIdsRef.current : store.selectedIds
    if (ids.length === 0) return

    const recordHistory = session.beginChange()
    const selected = store.selectedIds
    const sameSelection =
      ids.length === selected.length && ids.every((id, i) => id === selected[i])

    if (sameSelection) {
      store.applyStyleToSelected({ fill: paintSolid(hex) }, recordHistory)
      return
    }

    if (recordHistory) store.pushHistory()
    const nodes = { ...store.doc.nodes }
    let changed = false
    for (const id of ids) {
      const n = nodes[id]
      if (!n || n.locked) continue
      nodes[id] = { ...n, style: { ...n.style, fill: paintSolid(hex) } }
      changed = true
    }
    if (changed) useDocStore.setState((s) => ({ doc: { ...s.doc, nodes } }))
  }

  return (
    <ColorPicker
      value={draft}
      onOpen={() => {
        session.commit()
        openHexRef.current = draftRef.current
        targetIdsRef.current = [...useDocStore.getState().selectedIds]
      }}
      onChange={preview}
      onCancel={() => {
        session.cancel()
        setDraft(openHexRef.current)
        targetIdsRef.current = []
      }}
      onCommit={(hex) => {
        session.commit()
        openHexRef.current = hex
        setDraft(hex)
        targetIdsRef.current = []
      }}
      onAdd={(hex) => useDocStore.getState().addSwatch(hex)}
      addLabel="Add"
      aria-label="Add swatch"
      title="Pick colors · live preview on selection · Add stays open"
      size="sm"
    />
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
