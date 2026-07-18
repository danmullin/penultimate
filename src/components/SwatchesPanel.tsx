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
              <span>Close picker to add · pause on a color to keep it</span>
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
 * Native color pickers (esp. macOS) stream `input` while dragging and blur as
 * soon as the system panel opens. We:
 *  1. Never write the library on every drag tick
 *  2. Keep every color the user *pauses* on (plus the final value)
 *  3. Flush that set into Penultimate when the picker is actually gone
 *
 * We cannot read macOS Color Panel favorites from the web — only colors the
 * `<input type="color">` reports via input/change.
 */
function AddSwatchButton({ seed }: { seed: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(seed)
  const [pendingCount, setPendingCount] = useState(0)
  const draftRef = useRef(seed)
  const pendingRef = useRef(new Set<string>())
  const sessionRef = useRef({
    open: false,
    committed: false,
    /** True once the OS panel has taken over (typical macOS blur-on-open). */
    picking: false,
    focusedAt: 0,
  })
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    draftRef.current = seed
    setDraft(seed)
  }, [seed])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const clearSettleTimer = () => {
      if (settleTimer.current != null) {
        clearTimeout(settleTimer.current)
        settleTimer.current = null
      }
    }
    const clearCommitTimer = () => {
      if (commitTimer.current != null) {
        clearTimeout(commitTimer.current)
        commitTimer.current = null
      }
    }

    const remember = (raw: string) => {
      const c = toHex6(raw)
      if (!c || pendingRef.current.has(c)) return
      pendingRef.current.add(c)
      setPendingCount(pendingRef.current.size)
    }

    const syncFromInput = () => {
      const v = el.value
      draftRef.current = v
      setDraft(v)
      // Pause = intentional keep. Continuous drag keeps resetting this.
      clearSettleTimer()
      settleTimer.current = setTimeout(() => {
        settleTimer.current = null
        remember(draftRef.current)
      }, 220)
    }

    const commit = () => {
      const session = sessionRef.current
      if (!session.open || session.committed) return
      session.committed = true
      session.open = false
      session.picking = false
      clearSettleTimer()
      clearCommitTimer()
      remember(draftRef.current)
      const colors = [...pendingRef.current]
      pendingRef.current.clear()
      setPendingCount(0)
      if (colors.length > 0) useDocStore.getState().addSwatches(colors)
    }

    /** Schedule flush once the system panel is gone. */
    const scheduleCommit = (delayMs: number) => {
      clearCommitTimer()
      commitTimer.current = setTimeout(() => {
        commitTimer.current = null
        if (document.activeElement === el) return
        commit()
      }, delayMs)
    }

    const beginOrKeepSession = () => {
      clearCommitTimer()
      if (!sessionRef.current.open || sessionRef.current.committed) {
        pendingRef.current.clear()
        setPendingCount(0)
        sessionRef.current = {
          open: true,
          committed: false,
          picking: false,
          focusedAt: Date.now(),
        }
        draftRef.current = seed
        setDraft(seed)
      }
    }

    const onFocus = () => {
      beginOrKeepSession()
      sessionRef.current.focusedAt = Date.now()
    }

    const onBlur = () => {
      const session = sessionRef.current
      if (!session.open || session.committed) return
      session.picking = true
      // macOS: blur fires immediately when the panel opens — wait longer so a
      // still-open panel isn't flushed; input events cancel this timer.
      const early = Date.now() - session.focusedAt < 250
      scheduleCommit(early ? 1600 : 450)
    }

    const firefox = /firefox/i.test(navigator.userAgent)

    const onNativeChange = () => {
      syncFromInput()
      remember(el.value)
      // Firefox: native change usually means the panel closed.
      // Chromium/WebKit on macOS fire change while dragging — do not commit here.
      if (firefox) {
        queueMicrotask(() => {
          if (document.activeElement !== el) scheduleCommit(0)
        })
      }
    }

    const onWindowFocus = () => {
      const session = sessionRef.current
      if (!session.open || session.committed) return
      if (document.activeElement === el) return
      // Returning from the system color panel.
      if (session.picking || pendingRef.current.size > 0 || draftRef.current !== seed) {
        scheduleCommit(30)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const session = sessionRef.current
      if (!session.open || session.committed || !session.picking) return
      scheduleCommit(30)
    }

    /** Clicking back into the app after the panel closed. */
    const onPointerDownCapture = (ev: PointerEvent) => {
      const session = sessionRef.current
      if (!session.open || session.committed || !session.picking) return
      if (ev.target instanceof Node && el.contains(ev.target)) return
      scheduleCommit(0)
    }

    el.addEventListener('focus', onFocus)
    el.addEventListener('input', syncFromInput)
    el.addEventListener('change', onNativeChange)
    el.addEventListener('blur', onBlur)
    window.addEventListener('focus', onWindowFocus)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointerdown', onPointerDownCapture, true)

    return () => {
      clearSettleTimer()
      clearCommitTimer()
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('input', syncFromInput)
      el.removeEventListener('change', onNativeChange)
      el.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onWindowFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointerdown', onPointerDownCapture, true)
    }
  }, [seed])

  return (
    <label
      className="swatch-add"
      title={
        pendingCount > 0
          ? `${pendingCount} color${pendingCount === 1 ? '' : 's'} ready — close the picker to add`
          : 'Add colors to swatches (close the system picker to commit)'
      }
    >
      <span className="swatch-add__btn" aria-hidden>
        {pendingCount > 0 ? pendingCount : '+'}
      </span>
      <input
        ref={inputRef}
        type="color"
        aria-label="Add color to swatches"
        value={draft}
        onChange={(e) => {
          draftRef.current = e.target.value
          setDraft(e.target.value)
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
