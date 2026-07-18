import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useDocStore } from '../store/documentStore'
import { documentExtent } from '../types'

const RULER = 20

/**
 * Top + left rulers. Drag from a ruler onto the canvas to place a manual guide.
 * Tick positions track the live SVG (center/padding/scroll), not the pane origin.
 */
export function Rulers({
  scale,
  children,
}: {
  scale: number
  children: ReactNode
}) {
  const doc = useDocStore((s) => s.doc)
  const showRulers = useDocStore((s) => s.showRulers)
  const addManualGuide = useDocStore((s) => s.addManualGuide)
  const extent = documentExtent(doc)
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  /** Screen offset of document (extent.x, extent.y) within the canvas slot. */
  const [origin, setOrigin] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!showRulers) return
    const slot = canvasRef.current
    if (!slot) return

    const host = slot.querySelector('.artboard-host') as HTMLElement | null
    const svg = slot.querySelector('.artboard-svg') as SVGSVGElement | null
    if (!host || !svg) return

    const update = () => {
      const slotRect = slot.getBoundingClientRect()
      const svgRect = svg.getBoundingClientRect()
      setOrigin({
        x: svgRect.left - slotRect.left,
        y: svgRect.top - slotRect.top,
      })
    }

    update()
    host.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(host)
    ro.observe(svg)
    window.addEventListener('resize', update)
    return () => {
      host.removeEventListener('scroll', update)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [showRulers, scale, extent.x, extent.y, extent.width, extent.height])

  if (!showRulers) return <>{children}</>

  const tickLen = (major: boolean) => (major ? 8 : 4)

  const hTicks: Array<{ pos: number; major: boolean; label?: string }> = []
  const vTicks: Array<{ pos: number; major: boolean; label?: string }> = []
  const step = doc.settings.gridSize > 0 ? doc.settings.gridSize : 16
  const majorEvery = 5
  let i = 0
  for (let x = Math.ceil(extent.x / step) * step; x <= extent.x + extent.width; x += step) {
    const screen = origin.x + (x - extent.x) * scale
    hTicks.push({
      pos: screen,
      major: i % majorEvery === 0,
      label: i % majorEvery === 0 ? String(Math.round(x)) : undefined,
    })
    i++
  }
  i = 0
  for (let y = Math.ceil(extent.y / step) * step; y <= extent.y + extent.height; y += step) {
    const screen = origin.y + (y - extent.y) * scale
    vTicks.push({
      pos: screen,
      major: i % majorEvery === 0,
      label: i % majorEvery === 0 ? String(Math.round(y)) : undefined,
    })
    i++
  }

  const docPointFromClient = (clientX: number, clientY: number) => {
    const svg = canvasRef.current?.querySelector('.artboard-svg') as SVGSVGElement | null
    if (!svg) {
      return {
        x: (clientX - (hostRef.current?.getBoundingClientRect().left ?? 0) - RULER) / scale + extent.x,
        y: (clientY - (hostRef.current?.getBoundingClientRect().top ?? 0) - RULER) / scale + extent.y,
      }
    }
    const svgRect = svg.getBoundingClientRect()
    return {
      x: (clientX - svgRect.left) / scale + extent.x,
      y: (clientY - svgRect.top) / scale + extent.y,
    }
  }

  const onHRulerDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    const el = hostRef.current
    if (!el) return
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointerup', onUp)
      const rect = el.getBoundingClientRect()
      if (ev.clientY - rect.top > RULER) {
        const { y } = docPointFromClient(ev.clientX, ev.clientY)
        addManualGuide({ orientation: 'horizontal', position: y })
      }
    }
    window.addEventListener('pointerup', onUp)
  }

  const onVRulerDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    const el = hostRef.current
    if (!el) return
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointerup', onUp)
      const rect = el.getBoundingClientRect()
      if (ev.clientX - rect.left > RULER) {
        const { x } = docPointFromClient(ev.clientX, ev.clientY)
        addManualGuide({ orientation: 'vertical', position: x })
      }
    }
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div ref={hostRef} className="rulers-host">
      <div className="ruler ruler--corner" />
      <div className="ruler ruler--h" onPointerDown={onHRulerDown}>
        {hTicks.map((t, idx) => (
          <span
            key={`h${idx}`}
            className={`ruler__tick${t.major ? ' ruler__tick--major' : ''}`}
            style={{ left: t.pos, height: tickLen(t.major) }}
          >
            {t.label ? <span className="ruler__label">{t.label}</span> : null}
          </span>
        ))}
      </div>
      <div className="ruler ruler--v" onPointerDown={onVRulerDown}>
        {vTicks.map((t, idx) => (
          <span
            key={`v${idx}`}
            className={`ruler__tick ruler__tick--v${t.major ? ' ruler__tick--major' : ''}`}
            style={{ top: t.pos, width: tickLen(t.major) }}
          >
            {t.label ? <span className="ruler__label">{t.label}</span> : null}
          </span>
        ))}
      </div>
      <div ref={canvasRef} className="rulers-host__canvas">
        {children}
      </div>
    </div>
  )
}
