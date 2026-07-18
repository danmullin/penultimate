import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  hexToHsv,
  hsvToHex,
  normalizeHex,
  type HSV,
} from '../color/colorMath'

type Props = {
  value: string
  onChange: (hex: string) => void
  /** Accessible name for the well button. */
  'aria-label'?: string
  title?: string
  className?: string
  /** Compact well for tight toolbars. */
  size?: 'sm' | 'md'
}

/**
 * In-app color well + popover. Never uses `<input type="color">`, so macOS
 * / Firefox never open the system Color Panel.
 */
export function ColorPicker({
  value,
  onChange,
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
      const width = 220
      const height = 260
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
            hex={hex}
            top={pos.top}
            left={pos.left}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  )
}

function ColorPopover({
  panelRef,
  hex,
  top,
  left,
  onChange,
  onClose,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>
  hex: string
  top: number
  left: number
  onChange: (hex: string) => void
  onClose: () => void
}) {
  const labelId = useId()
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(hex))
  const [hexDraft, setHexDraft] = useState(hex)
  const hsvRef = useRef(hsv)
  hsvRef.current = hsv
  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)

  // Sync from outside when well value changes while open (rare).
  useEffect(() => {
    const next = hexToHsv(hex)
    setHsv(next)
    hsvRef.current = next
    setHexDraft(hex)
  }, [hex])

  const applyHsv = (next: HSV) => {
    const clamped = {
      h: ((next.h % 360) + 360) % 360,
      s: Math.max(0, Math.min(1, next.s)),
      v: Math.max(0, Math.min(1, next.v)),
    }
    hsvRef.current = clamped
    setHsv(clamped)
    const out = hsvToHex(clamped)
    setHexDraft(out)
    onChange(out)
  }

  const dragSv = (clientX: number, clientY: number) => {
    const el = svRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const s = r.width > 0 ? (clientX - r.left) / r.width : 0
    const v = r.height > 0 ? 1 - (clientY - r.top) / r.height : 0
    applyHsv({ ...hsvRef.current, s, v })
  }

  const dragHue = (clientX: number) => {
    const el = hueRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const t = r.width > 0 ? (clientX - r.left) / r.width : 0
    applyHsv({ ...hsvRef.current, h: Math.max(0, Math.min(1, t)) * 360 })
  }

  const onSvPointer = (e: ReactPointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragSv(e.clientX, e.clientY)
  }

  const onHuePointer = (e: ReactPointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragHue(e.clientX)
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 })
  const canEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window

  return (
    <div
      ref={panelRef}
      className="color-popover"
      style={{ top, left }}
      role="dialog"
      aria-labelledby={labelId}
    >
      <div className="color-popover__head">
        <span id={labelId}>Color</span>
        <button type="button" className="color-popover__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

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
          dragHue(e.clientX)
        }}
      >
        <span className="color-popover__hue-thumb" style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>

      <div className="color-popover__row">
        <span className="color-popover__preview" style={{ background: hsvToHex(hsv) }} />
        <input
          className="color-popover__hex"
          value={hexDraft}
          spellCheck={false}
          aria-label="Hex color"
          onChange={(e) => {
            const raw = e.target.value
            setHexDraft(raw)
            const n = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`)
            if (n) {
              setHsv(hexToHsv(n))
              onChange(n)
            }
          }}
          onBlur={() => {
            const n = normalizeHex(hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`)
            setHexDraft(n ?? hsvToHex(hsv))
          }}
        />
        {canEyeDropper && (
          <button
            type="button"
            className="color-popover__drop"
            title="Sample from screen"
            aria-label="Sample from screen"
            onClick={async () => {
              try {
                const ED = (
                  window as Window & {
                    EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> }
                  }
                ).EyeDropper
                const result = await new ED().open()
                const n = normalizeHex(result.sRGBHex)
                if (n) {
                  setHsv(hexToHsv(n))
                  setHexDraft(n)
                  onChange(n)
                }
              } catch {
                /* user cancelled */
              }
            }}
          >
            ⌖
          </button>
        )}
      </div>
    </div>
  )
}
