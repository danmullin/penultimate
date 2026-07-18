import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  hexToHsv,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  rgbToHex,
  type HSV,
} from '../color/colorMath'
import { useTitleBarDrag } from '../hooks/useTitleBarDrag'

type Props = {
  value: string
  /** Live preview while picking. */
  onChange: (hex: string) => void
  /** Cancel / Escape / click-away — revert selection (e.g. undo session). */
  onCancel?: () => void
  /** OK — keep the previewed color. */
  onCommit?: (hex: string) => void
  /** Fired when the popover opens (snapshot “current” here). */
  onOpen?: () => void
  /** When set, shows Add (picker stays open). */
  onAdd?: (hex: string) => void
  addLabel?: string
  'aria-label'?: string
  title?: string
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Photoshop-style in-app color picker. Never uses `<input type="color">`.
 * OK keeps the live color; Cancel / Escape / click-away restores the open-time color.
 */
export function ColorPicker({
  value,
  onChange,
  onCancel,
  onCommit,
  onOpen,
  onAdd,
  addLabel = 'Add',
  'aria-label': ariaLabel = 'Color',
  title,
  className,
  size = 'md',
}: Props) {
  const hex = normalizeHex(value) ?? '#808080'
  const [open, setOpen] = useState(false)
  const wellRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  useLayoutEffect(() => {
    if (!open || !wellRef.current) return
    const place = () => {
      const r = wellRef.current!.getBoundingClientRect()
      const pad = 8
      const width = 480
      const height = 340
      let left = r.left
      let top = r.bottom + 6
      if (left + width > window.innerWidth - pad) left = window.innerWidth - width - pad
      if (left < pad) left = pad
      if (top + height > window.innerHeight - pad) top = Math.max(pad, r.top - height - 6)
      setPos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={wellRef}
        type="button"
        className={`color-well color-well--${size}${className ? ` ${className}` : ''}`}
        style={{ background: hex }}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={title ?? ariaLabel}
        onClick={() =>
          setOpen((v) => {
            if (!v) onOpenRef.current?.()
            return !v
          })
        }
      />
      {open &&
        createPortal(
          <ColorPopover
            panelRef={popRef}
            wellRef={wellRef}
            initialHex={hex}
            top={pos.top}
            left={pos.left}
            onChange={onChange}
            onCancel={onCancel}
            onCommit={onCommit}
            onAdd={onAdd}
            addLabel={addLabel}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  )
}

function ColorPopover({
  panelRef,
  wellRef,
  initialHex,
  top,
  left,
  onChange,
  onCancel,
  onCommit,
  onAdd,
  addLabel,
  onClose,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>
  wellRef: React.RefObject<HTMLButtonElement | null>
  initialHex: string
  top: number
  left: number
  onChange: (hex: string) => void
  onCancel?: () => void
  onCommit?: (hex: string) => void
  onAdd?: (hex: string) => void
  addLabel: string
  onClose: () => void
}) {
  const labelId = useId()
  const currentRef = useRef(initialHex)
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(initialHex))
  const [hexDraft, setHexDraft] = useState(initialHex.replace(/^#/, ''))
  const hsvRef = useRef(hsv)
  hsvRef.current = hsv
  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const { pos, reset, titleBarProps } = useTitleBarDrag({ left, top })

  useLayoutEffect(() => {
    reset({ left, top })
  }, [left, top, reset])

  const newHex = hsvToHex(hsv)
  const rgb = useMemo(() => hexToRgb(newHex) ?? { r: 0, g: 0, b: 0 }, [newHex])

  const onChangeRef = useRef(onChange)
  const onCancelRef = useRef(onCancel)
  const onCommitRef = useRef(onCommit)
  const onCloseRef = useRef(onClose)
  onChangeRef.current = onChange
  onCancelRef.current = onCancel
  onCommitRef.current = onCommit
  onCloseRef.current = onClose

  /** Block click-away while scrubbing the spectrum (mousedown can miss contains checks). */
  const scrubbingRef = useRef(false)

  const emit = (hex: string) => {
    onChangeRef.current(hex)
  }

  const commit = (next: HSV) => {
    const clamped = {
      h: ((next.h % 360) + 360) % 360,
      s: Math.max(0, Math.min(1, next.s)),
      v: Math.max(0, Math.min(1, next.v)),
    }
    hsvRef.current = clamped
    setHsv(clamped)
    const out = hsvToHex(clamped)
    setHexDraft(out.replace(/^#/, ''))
    emit(out)
  }

  const commitHex = (raw: string) => {
    const n = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`)
    if (!n) return false
    const next = hexToHsv(n)
    hsvRef.current = next
    setHsv(next)
    setHexDraft(n.replace(/^#/, ''))
    emit(n)
    return true
  }

  const commitRgb = (r: number, g: number, b: number) => {
    const out = rgbToHex(r, g, b)
    const next = hexToHsv(out)
    hsvRef.current = next
    setHsv(next)
    setHexDraft(out.replace(/^#/, ''))
    emit(out)
  }

  const dragSv = (clientX: number, clientY: number) => {
    const el = svRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const s = r.width > 0 ? (clientX - r.left) / r.width : 0
    const v = r.height > 0 ? 1 - (clientY - r.top) / r.height : 0
    commit({ ...hsvRef.current, s, v })
  }

  const dragHue = (clientY: number) => {
    const el = hueRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const t = r.height > 0 ? (clientY - r.top) / r.height : 0
    commit({ ...hsvRef.current, h: Math.max(0, Math.min(1, t)) * 360 })
  }

  const startScrub = (mode: 'sv' | 'hue', e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    scrubbingRef.current = true
    if (mode === 'sv') dragSv(e.clientX, e.clientY)
    else dragHue(e.clientY)

    const onMove = (ev: PointerEvent) => {
      if (mode === 'sv') dragSv(ev.clientX, ev.clientY)
      else dragHue(ev.clientY)
    }
    const onUp = () => {
      scrubbingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const cancel = () => {
    if (onCancelRef.current) onCancelRef.current()
    else onChangeRef.current(currentRef.current)
    onCloseRef.current()
  }

  const confirm = () => {
    const hex = hsvToHex(hsvRef.current)
    onCommitRef.current?.(hex)
    onCloseRef.current()
  }

  useEffect(() => {
    const inPicker = (e: Event) => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : []
      if (panelRef.current && path.includes(panelRef.current)) return true
      if (wellRef.current && path.includes(wellRef.current)) return true
      const t = e.target as Node | null
      if (t && panelRef.current?.contains(t)) return true
      if (t && wellRef.current?.contains(t)) return true
      return false
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    }
    const onPointerDown = (e: PointerEvent) => {
      if (scrubbingRef.current) return
      if (inPicker(e)) return
      cancel()
    }

    // Defer so the opening click cannot dismiss immediately.
    const timer = window.setTimeout(() => {
      window.addEventListener('keydown', onKey, true)
      window.addEventListener('pointerdown', onPointerDown, true)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 })
  const hDeg = Math.round(hsv.h)
  const sPct = Math.round(hsv.s * 100)
  const bPct = Math.round(hsv.v * 100)

  return (
    <div
      ref={panelRef}
      className="color-popover"
      data-drag-panel
      style={{ top: pos?.top ?? top, left: pos?.left ?? left }}
      role="dialog"
      aria-labelledby={labelId}
    >
      <div className="color-popover__title" id={labelId} {...titleBarProps}>
        Color Picker
      </div>

      <div className="color-popover__body">
        <div className="color-popover__spectrum">
          <div
            ref={svRef}
            className="color-popover__sv"
            style={{ backgroundColor: hueColor }}
            onPointerDown={(e) => startScrub('sv', e)}
          >
            <div className="color-popover__sv-white" />
            <div className="color-popover__sv-black" />
            <span
              className="color-popover__thumb"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
            />
          </div>

          <div
            ref={hueRef}
            className="color-popover__hue"
            onPointerDown={(e) => startScrub('hue', e)}
          >
            <span
              className="color-popover__hue-tri color-popover__hue-tri--l"
              style={{ top: `${(hsv.h / 360) * 100}%` }}
            />
            <span
              className="color-popover__hue-tri color-popover__hue-tri--r"
              style={{ top: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
        </div>

        <div className="color-popover__main">
          <div className="color-popover__main-top">
            <div className="color-popover__compare-stack">
              <span className="color-popover__compare-label">new</span>
              <div className="color-popover__compare-swatches">
                <div className="color-popover__compare-swatch" style={{ background: newHex }} />
                <div
                  className="color-popover__compare-swatch"
                  style={{ background: currentRef.current }}
                  onClick={() => commitHex(currentRef.current)}
                  title="Reset to current"
                  role="button"
                />
              </div>
              <span className="color-popover__compare-label">current</span>
            </div>

            <div className="color-popover__actions">
              <button
                type="button"
                className="color-popover__btn color-popover__btn--ok"
                onClick={confirm}
              >
                OK
              </button>
              <button type="button" className="color-popover__btn" onClick={cancel}>
                Cancel
              </button>
              {onAdd && (
                <button type="button" className="color-popover__btn" onClick={() => onAdd(newHex)}>
                  {addLabel}
                </button>
              )}
            </div>
          </div>

          <div className="color-popover__fields">
            <fieldset className="color-popover__model">
              <label className="color-popover__field">
                <input type="radio" name="cp-model" checked readOnly aria-label="HSB hue mode" />
                <span>H:</span>
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={hDeg}
                  aria-label="Hue"
                  onChange={(e) => commit({ ...hsvRef.current, h: Number(e.target.value) || 0 })}
                />
                <em>°</em>
              </label>
              <label className="color-popover__field">
                <span className="color-popover__radio-spacer" />
                <span>S:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={sPct}
                  aria-label="Saturation"
                  onChange={(e) =>
                    commit({ ...hsvRef.current, s: (Number(e.target.value) || 0) / 100 })
                  }
                />
                <em>%</em>
              </label>
              <label className="color-popover__field">
                <span className="color-popover__radio-spacer" />
                <span>B:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bPct}
                  aria-label="Brightness"
                  onChange={(e) =>
                    commit({ ...hsvRef.current, v: (Number(e.target.value) || 0) / 100 })
                  }
                />
                <em>%</em>
              </label>
            </fieldset>

            <fieldset className="color-popover__model">
              <label className="color-popover__field">
                <input type="radio" name="cp-model" disabled aria-hidden tabIndex={-1} />
                <span>R:</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb.r)}
                  aria-label="Red"
                  onChange={(e) => commitRgb(Number(e.target.value) || 0, rgb.g, rgb.b)}
                />
                <em />
              </label>
              <label className="color-popover__field">
                <span className="color-popover__radio-spacer" />
                <span>G:</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb.g)}
                  aria-label="Green"
                  onChange={(e) => commitRgb(rgb.r, Number(e.target.value) || 0, rgb.b)}
                />
                <em />
              </label>
              <label className="color-popover__field">
                <span className="color-popover__radio-spacer" />
                <span>B:</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb.b)}
                  aria-label="Blue"
                  onChange={(e) => commitRgb(rgb.r, rgb.g, Number(e.target.value) || 0)}
                />
                <em />
              </label>
            </fieldset>

            <label className="color-popover__hex-row">
              <span>#</span>
              <input
                value={hexDraft}
                spellCheck={false}
                aria-label="Hex color"
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                  setHexDraft(raw)
                  if (raw.length === 6) commitHex(`#${raw}`)
                }}
                onBlur={() => {
                  const n = normalizeHex(`#${hexDraft}`)
                  setHexDraft((n ?? newHex).replace(/^#/, ''))
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
