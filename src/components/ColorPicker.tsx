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

type Props = {
  value: string
  onChange: (hex: string) => void
  /** When set, shows Add to Swatches (picker stays open). */
  onAdd?: (hex: string) => void
  addLabel?: string
  'aria-label'?: string
  title?: string
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Photoshop-style in-app color picker. Never uses `<input type="color">`.
 */
export function ColorPicker({
  value,
  onChange,
  onAdd,
  addLabel = 'Add to Swatches',
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

  useLayoutEffect(() => {
    if (!open || !wellRef.current) return
    const place = () => {
      const r = wellRef.current!.getBoundingClientRect()
      const pad = 8
      const width = 460
      const height = 380
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

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (wellRef.current?.contains(t)) return
      if (popRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
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
        onClick={() => setOpen((v) => !v)}
      />
      {open &&
        createPortal(
          <ColorPopover
            panelRef={popRef}
            initialHex={hex}
            top={pos.top}
            left={pos.left}
            onChange={onChange}
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
  initialHex,
  top,
  left,
  onChange,
  onAdd,
  addLabel,
  onClose,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>
  initialHex: string
  top: number
  left: number
  onChange: (hex: string) => void
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

  const newHex = hsvToHex(hsv)
  const rgb = useMemo(() => hexToRgb(newHex) ?? { r: 0, g: 0, b: 0 }, [newHex])

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
    onChange(out)
  }

  const commitHex = (raw: string) => {
    const n = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`)
    if (!n) return false
    const next = hexToHsv(n)
    hsvRef.current = next
    setHsv(next)
    setHexDraft(n.replace(/^#/, ''))
    onChange(n)
    return true
  }

  const commitRgb = (r: number, g: number, b: number) => {
    const out = rgbToHex(r, g, b)
    const next = hexToHsv(out)
    hsvRef.current = next
    setHsv(next)
    setHexDraft(out.replace(/^#/, ''))
    onChange(out)
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

  const onSvPointer = (e: ReactPointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragSv(e.clientX, e.clientY)
  }

  const onHuePointer = (e: ReactPointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragHue(e.clientY)
  }

  const cancel = () => {
    onChange(currentRef.current)
    onClose()
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 })
  const hDeg = Math.round(hsv.h)
  const sPct = Math.round(hsv.s * 100)
  const bPct = Math.round(hsv.v * 100)

  return (
    <div
      ref={panelRef}
      className="color-popover"
      style={{ top, left }}
      role="dialog"
      aria-labelledby={labelId}
    >
      <div className="color-popover__title" id={labelId}>
        Color Picker
      </div>

      <div className="color-popover__body">
        <div
          ref={svRef}
          className="color-popover__sv"
          style={{ backgroundColor: hueColor }}
          onPointerDown={onSvPointer}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return
            dragSv(e.clientX, e.clientY)
          }}
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
          onPointerDown={onHuePointer}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return
            dragHue(e.clientY)
          }}
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

        <div className="color-popover__compare-stack">
          <div className="color-popover__compare-block">
            <span>new</span>
            <div className="color-popover__compare-swatch" style={{ background: newHex }} />
          </div>
          <div className="color-popover__compare-block">
            <span>current</span>
            <div
              className="color-popover__compare-swatch"
              style={{ background: currentRef.current }}
              onClick={() => commitHex(currentRef.current)}
              title="Reset to current"
              role="button"
            />
          </div>
        </div>

        <div className="color-popover__actions">
          <button type="button" className="color-popover__btn color-popover__btn--ok" onClick={onClose}>
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
  )
}
