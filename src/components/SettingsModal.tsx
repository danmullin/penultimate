import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDocStore } from '../store/documentStore'
import { useUiTheme } from '../hooks/useUiTheme'
import { useTitleBarDrag } from '../hooks/useTitleBarDrag'
import { IconButton } from './Icon'

/**
 * Illustrator-style preferences: view chrome, grid/snap, and editor defaults.
 */
export function SettingsModal() {
  const open = useDocStore((s) => s.settingsOpen)
  const setSettingsOpen = useDocStore((s) => s.setSettingsOpen)
  const doc = useDocStore((s) => s.doc)
  const setSettings = useDocStore((s) => s.setSettings)
  const showRulers = useDocStore((s) => s.showRulers)
  const setShowRulers = useDocStore((s) => s.setShowRulers)
  const outlineMode = useDocStore((s) => s.outlineMode)
  const setOutlineMode = useDocStore((s) => s.setOutlineMode)
  const aspectLock = useDocStore((s) => s.aspectLock)
  const setAspectLock = useDocStore((s) => s.setAspectLock)
  const { theme, setTheme, themes } = useUiTheme()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const { pos, reset, titleBarProps } = useTitleBarDrag()

  useEffect(() => {
    if (!open) return
    reset(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    const prev = document.activeElement
    panelRef.current?.querySelector<HTMLElement>('button, input, select')?.focus()
    return () => {
      window.removeEventListener('keydown', onKey, true)
      if (prev instanceof HTMLElement) prev.focus()
    }
  }, [open, setSettingsOpen, reset])

  if (!open) return null

  return createPortal(
    <div
      className="settings-modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false)
      }}
    >
      <div
        ref={panelRef}
        className="settings-modal__panel"
        data-drag-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={
          pos
            ? { position: 'fixed', left: pos.left, top: pos.top, margin: 0 }
            : undefined
        }
      >
        <div className="settings-modal__header" {...titleBarProps}>
          <h2 id={titleId} className="settings-modal__title">
            Preferences
          </h2>
          <IconButton icon="cancel" label="Close preferences" onClick={() => setSettingsOpen(false)} />
        </div>

        <div className="settings-modal__body">
          <section className="settings-section">
            <h3 className="settings-section__title">View</h3>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={showRulers}
                onChange={(e) => setShowRulers(e.target.checked)}
              />
              <span className="settings-row__label">
                Show rulers
                <span className="settings-row__hint">Drag from a ruler to place guides</span>
              </span>
            </label>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={outlineMode}
                onChange={(e) => setOutlineMode(e.target.checked)}
              />
              <span className="settings-row__label">
                Outline mode
                <span className="settings-row__hint">Wireframe view — press ` to toggle</span>
              </span>
            </label>
          </section>

          <section className="settings-section">
            <h3 className="settings-section__title">Guides &amp; Grid</h3>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={doc.settings.snapToGrid}
                onChange={(e) => setSettings({ snapToGrid: e.target.checked })}
              />
              <span className="settings-row__label">Snap to grid</span>
            </label>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={doc.settings.snapToNeighbors}
                onChange={(e) => setSettings({ snapToNeighbors: e.target.checked })}
              />
              <span className="settings-row__label">
                Smart guides
                <span className="settings-row__hint">
                  Snap to artboard edges/centers and nearby objects while moving or drawing
                </span>
              </span>
            </label>
            <label className="settings-row settings-row--field">
              <span className="settings-row__label">Grid size</span>
              <input
                type="number"
                min={1}
                max={512}
                step={1}
                value={doc.settings.gridSize}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n) && n >= 1) setSettings({ gridSize: Math.round(n) })
                }}
              />
            </label>
            <label className="settings-row settings-row--field">
              <span className="settings-row__label">Snap distance</span>
              <input
                type="number"
                min={1}
                max={64}
                step={1}
                value={doc.settings.snapThreshold}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n) && n >= 1) setSettings({ snapThreshold: Math.round(n) })
                }}
              />
            </label>
          </section>

          <section className="settings-section">
            <h3 className="settings-section__title">Tools</h3>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={aspectLock}
                onChange={(e) => setAspectLock(e.target.checked)}
              />
              <span className="settings-row__label">
                Constrain proportions
                <span className="settings-row__hint">Lock aspect ratio when scaling (Shift also locks)</span>
              </span>
            </label>
          </section>

          <section className="settings-section">
            <h3 className="settings-section__title">Document</h3>
            <p className="settings-row__hint" style={{ margin: '0 0 0.5rem' }}>
              Soft-save keeps a local draft in this browser (IndexedDB). If the tab
              closes, Penultimate restores your artboard automatically on next open.
              Use <strong>Save</strong> for a real <code>.vector.json</code> file —
              that includes artboards, layers, swatches, and manual guides.
            </p>
          </section>

          <section className="settings-section">
            <h3 className="settings-section__title">Appearance</h3>
            <label className="settings-row settings-row--field">
              <span className="settings-row__label">
                UI theme
                <span className="settings-row__hint">Also available in the menu bar</span>
              </span>
              <select
                value={theme}
                aria-label="UI theme"
                onChange={(e) => setTheme(e.target.value as typeof theme)}
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="settings-row__hint" style={{ margin: '0.35rem 0 0' }}>
              Colors use an in-app picker (not the OS color panel). OK keeps the
              preview; Cancel or Esc reverts.
            </p>
          </section>
        </div>

        <div className="settings-modal__footer">
          <button type="button" className="primary-btn" onClick={() => setSettingsOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
