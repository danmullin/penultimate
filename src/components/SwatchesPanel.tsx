import { useEffect, useRef, useState } from 'react'
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
              <AddSwatchButton seed={seed} />
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
 * Never commit from `input` / React `onChange` / native `change` — those stream
 * while dragging (and React's onChange is native `input`).
 *
 * macOS Firefox/Chrome: opening the system color panel blurs the input right
 * away, and blur can keep firing as the color moves. We treat that as "still
 * picking", keep draft local, and add exactly one swatch when the picker is gone
 * (window focus, or a blur that isn't followed by more input).
 */
function AddSwatchButton({ seed }: { seed: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(seed)
  const draftRef = useRef(seed)
  const sessionRef = useRef({
    open: false,
    committed: false,
    armed: false,
    focusedAt: 0,
  })
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    draftRef.current = seed
    setDraft(seed)
  }, [seed])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const clearCommitTimer = () => {
      if (commitTimer.current != null) {
        clearTimeout(commitTimer.current)
        commitTimer.current = null
      }
    }

    const commit = () => {
      const session = sessionRef.current
      if (!session.open || session.committed) return
      session.committed = true
      session.open = false
      session.armed = false
      clearCommitTimer()
      useDocStore.getState().addSwatch(draftRef.current)
    }

    const armDismissTimer = () => {
      clearCommitTimer()
      commitTimer.current = setTimeout(() => {
        commitTimer.current = null
        if (document.activeElement === el) return
        commit()
      }, 500)
    }

    const onFocus = () => {
      clearCommitTimer()
      sessionRef.current = {
        open: true,
        committed: false,
        armed: false,
        focusedAt: Date.now(),
      }
      draftRef.current = seed
      setDraft(seed)
    }

    const syncDraft = () => {
      draftRef.current = el.value
      setDraft(el.value)
      // Still dragging in the OS panel — do not commit yet.
      if (sessionRef.current.armed) clearCommitTimer()
    }

    const onBlur = () => {
      const session = sessionRef.current
      if (!session.open || session.committed) return
      session.armed = true
      // Spurious blur when the macOS color panel opens: wait for more signals.
      if (Date.now() - session.focusedAt < 200) return
      armDismissTimer()
    }

    const onWindowFocus = () => {
      const session = sessionRef.current
      if (!session.open || session.committed || !session.armed) return
      if (document.activeElement === el) return
      clearCommitTimer()
      commit()
    }

    el.addEventListener('focus', onFocus)
    el.addEventListener('input', syncDraft)
    el.addEventListener('change', syncDraft)
    el.addEventListener('blur', onBlur)
    window.addEventListener('focus', onWindowFocus)

    return () => {
      clearCommitTimer()
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('input', syncDraft)
      el.removeEventListener('change', syncDraft)
      el.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [seed])

  return (
    <label className="swatch-add" title="Add a color to swatches">
      <span className="swatch-add__btn" aria-hidden>
        +
      </span>
      <input
        ref={inputRef}
        type="color"
        aria-label="Add color to swatches"
        value={draft}
        onChange={(e) => {
          draftRef.current = e.target.value
          setDraft(e.target.value)
          if (sessionRef.current.armed) {
            if (commitTimer.current != null) {
              clearTimeout(commitTimer.current)
              commitTimer.current = null
            }
          }
        }}
      />
    </label>
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
