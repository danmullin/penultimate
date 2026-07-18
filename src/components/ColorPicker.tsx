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

export type ColorPickerPlatform = 'mac' | 'win'

type Props = {
  value: string
  onChange: (hex: string) => void
  'aria-label'?: string
  title?: string
  className?: string
  size?: 'sm' | 'md'
  /** Override auto-detect (useful for previews). */
  platform?: ColorPickerPlatform
}

/** Classic Windows custom-color dialog basics. */
const WIN_BASIC: string[] = [
  '#ff8080', '#ffff80', '#80ff80', '#00ff80', '#80ffff', '#0080ff', '#ff80c0', '#ff80ff',
  '#ff0000', '#ffff00', '#80ff00', '#00ff40', '#00ffff', '#0080c0', '#8080c0', '#ff00ff',
  '#804040', '#ff8040', '#00ff00', '#008080', '#004080', '#8080ff', '#800040', '#ff0080',
  '#800000', '#ff8000', '#008000', '#008040', '#0000ff', '#0000a0', '#800080', '#8000ff',
  '#400000', '#804000', '#004000', '#004040', '#000080', '#000040', '#400040', '#400080',
  '#000000', '#808000', '#808040', '#808080', '#408080', '#c0c0c0', '#400040', '#ffffff',
]

export function detectColorPickerPlatform(): ColorPickerPlatform {
  if (typeof navigator === 'undefined') return 'win'
  const ua = navigator.userAgent
  const platform = navigator.platform || ''
  if (/Mac|iPhone|iPad|iPod/i.test(ua) || /Mac/i.test(platform)) return 'mac'
  return 'win'
}

/**
 * In-app color well + popover. Skins mimic macOS Color Panel vs Windows Color
 * dialog. Never uses `<input type="color">`.
 */
export function ColorPicker({
  value,
  onChange,
  'aria-label': ariaLabel = 'Color',
  title,
  className,
  size = 'md',
  platform: platformProp,
}: Props) {
  const platform = platformProp ?? detectColorPickerPlatform()
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
      const width = platform === 'mac' ? 248 : 292
      const height = platform === 'mac' ? 300 : 340
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
  }, [open, platform])

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
        className={`color-well color-well--${size} color-well--${platform}${className ? ` ${className}` : ''}`}
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
            platform={platform}
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
  platform,
  hex,
  top,
  left,
  onChange,
  onClose,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>
  platform: ColorPickerPlatform
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

  useEffect(() => {
    const next = hexToHsv(hex)
    setHsv(next)
    hsvRef.current = next
    setHexDraft(hex)
  }, [hex])

  const rgb = useMemo(() => hexToRgb(hsvToHex(hsv)) ?? { r: 0, g: 0, b: 0 }, [hsv])

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

  const applyHex = (raw: string) => {
    setHexDraft(raw)
    const n = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`)
    if (!n) return
    const next = hexToHsv(n)
    hsvRef.current = next
    setHsv(next)
    onChange(n)
  }

  const applyRgb = (channel: 'r' | 'g' | 'b', value: number) => {
    const next = { ...rgb, [channel]: Math.max(0, Math.min(255, Math.round(value))) }
    const out = rgbToHex(next.r, next.g, next.b)
    const hsvNext = hexToHsv(out)
    hsvRef.current = hsvNext
    setHsv(hsvNext)
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

  const dragHue = (clientX: number, clientY: number, vertical: boolean) => {
    const el = hueRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const t = vertical
      ? r.height > 0
        ? (clientY - r.top) / r.height
        : 0
      : r.width > 0
        ? (clientX - r.left) / r.width
        : 0
    applyHsv({ ...hsvRef.current, h: Math.max(0, Math.min(1, t)) * 360 })
  }

  const onSvPointer = (e: ReactPointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragSv(e.clientX, e.clientY)
  }

  const onHuePointer = (vertical: boolean) => (e: ReactPointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragHue(e.clientX, e.clientY, vertical)
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 })
  const canEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window
  const verticalHue = platform === 'win'

  const sampleScreen = async () => {
    try {
      const ED = (
        window as unknown as {
          EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> }
        }
      ).EyeDropper
      const result = await new ED().open()
      const n = normalizeHex(result.sRGBHex)
      if (n) applyHex(n)
    } catch {
      /* cancelled */
    }
  }

  return (
    <div
      ref={panelRef}
      className={`color-popover color-popover--${platform}`}
      style={{ top, left }}
      role="dialog"
      aria-labelledby={labelId}
    >
      <div className="color-popover__head">
        <span id={labelId}>{platform === 'mac' ? 'Colors' : 'Color'}</span>
        <button type="button" className="color-popover__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {platform === 'win' && (
        <div className="color-popover__basic" role="listbox" aria-label="Basic colors">
          {WIN_BASIC.map((c) => (
            <button
              key={c}
              type="button"
              role="option"
              className="color-popover__basic-chip"
              style={{ background: c }}
              aria-label={c}
              title={c}
              onClick={() => applyHex(c)}
            />
          ))}
        </div>
      )}

      <div className={`color-popover__stage color-popover__stage--${platform}`}>
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
          className={`color-popover__hue color-popover__hue--${verticalHue ? 'v' : 'h'}`}
          onPointerDown={onHuePointer(verticalHue)}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return
            dragHue(e.clientX, e.clientY, verticalHue)
          }}
        >
          <span
            className="color-popover__hue-thumb"
            style={
              verticalHue
                ? { top: `${(hsv.h / 360) * 100}%` }
                : { left: `${(hsv.h / 360) * 100}%` }
            }
          />
        </div>
      </div>

      {platform === 'mac' ? (
        <div className="color-popover__mac-foot">
          <span className="color-popover__preview color-popover__preview--mac" style={{ background: hsvToHex(hsv) }} />
          <label className="color-popover__mac-hex">
            <span>Hex</span>
            <input
              value={hexDraft}
              spellCheck={false}
              aria-label="Hex color"
              onChange={(e) => applyHex(e.target.value)}
              onBlur={() => {
                const n = normalizeHex(hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`)
                setHexDraft(n ?? hsvToHex(hsv))
              }}
            />
          </label>
          {canEyeDropper && (
            <button
              type="button"
              className="color-popover__drop"
              title="Sample from screen"
              aria-label="Sample from screen"
              onClick={sampleScreen}
            >
              ⌖
            </button>
          )}
        </div>
      ) : (
        <div className="color-popover__win-foot">
          <span className="color-popover__preview color-popover__preview--win" style={{ background: hsvToHex(hsv) }} />
          <div className="color-popover__rgb">
            {(['r', 'g', 'b'] as const).map((ch) => (
              <label key={ch} className="color-popover__rgb-field">
                <span>{ch.toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  aria-label={`${ch.toUpperCase()} channel`}
                  onChange={(e) => applyRgb(ch, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
          <label className="color-popover__win-hex">
            <span>#</span>
            <input
              value={hexDraft.replace(/^#/, '')}
              spellCheck={false}
              aria-label="Hex color"
              onChange={(e) => applyHex(`#${e.target.value}`)}
              onBlur={() => {
                const n = normalizeHex(hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`)
                setHexDraft(n ?? hsvToHex(hsv))
              }}
            />
          </label>
          {canEyeDropper && (
            <button
              type="button"
              className="color-popover__drop"
              title="Sample from screen"
              aria-label="Sample from screen"
              onClick={sampleScreen}
            >
              ⌖
            </button>
          )}
        </div>
      )}
    </div>
  )
}
