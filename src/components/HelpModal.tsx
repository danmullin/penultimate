import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FEATURE_SECTIONS } from '../data/features'
import { useDocStore } from '../store/documentStore'
import { IconButton } from './Icon'

/** In-app feature + shortcut reference (same catalog as README). */
export function HelpModal() {
  const open = useDocStore((s) => s.helpOpen)
  const setHelpOpen = useDocStore((s) => s.setHelpOpen)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, setHelpOpen])

  if (!open) return null

  return createPortal(
    <div
      className="settings-modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setHelpOpen(false)
      }}
    >
      <div
        ref={panelRef}
        className="settings-modal__panel help-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="settings-modal__header">
          <h2 id={titleId} className="settings-modal__title">
            Features &amp; shortcuts
          </h2>
          <IconButton icon="cancel" label="Close help" onClick={() => setHelpOpen(false)} />
        </div>

        <div className="settings-modal__body help-modal__body">
          <p className="help-modal__intro">
            <strong>Penultimate</strong> — handles worth dragging.{' '}
            <kbd>Ctrl</kbd> is <kbd>Cmd</kbd> on macOS.
          </p>
          {FEATURE_SECTIONS.map((section) => (
            <section key={section.title} className="settings-section">
              <h3 className="settings-section__title">{section.title}</h3>
              <ul className="help-list">
                {section.items.map((item) => (
                  <li key={item.name} className="help-list__row">
                    <span className="help-list__name">{item.name}</span>
                    <span className="help-list__keys">
                      {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                      {item.note ? (
                        <span className="help-list__note">{item.note}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="settings-modal__footer">
          <button type="button" className="primary-btn" onClick={() => setHelpOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
