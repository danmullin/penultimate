import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useDocStore } from '../store/documentStore'

const RULER = 20

/**
 * Top + left rulers. Drag from a ruler onto the canvas to place a manual guide.
 * Tick positions track the live SVG viewBox (camera zoom/pan).
 *
 * The host shell always stays mounted so toggling rulers does not remount the
 * artboard (which would drop wheel zoom listeners and kick auto-fit).
 */
export function Rulers({
  scale,
  camera,
  children,
}: {
  scale: number
  camera: { x: number; y: number }
  children: ReactNode
}) {
  const doc = useDocStore((s) => s.doc)
  const showRulers = useDocStore((s) => s.showRulers)
  const addManualGuide = useDocStore((s) => s.addManualGuide)
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  /** Visible document window + screen placement of the SVG within the canvas slot. */
  const [view, setView] = useState({
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0,
    vw: 1,
    vh: 1,
    sw: 1,
    sh: 1,
  })

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
      const vb = svg.viewBox.baseVal
      setView({
        ox: svgRect.left - slotRect.left,
        oy: svgRect.top - slotRect.top,
        vx: vb.x,
        vy: vb.y,
        vw: Math.max(vb.width, 0.0001),
        vh: Math.max(vb.height, 0.0001),
        sw: Math.max(svgRect.width, 1),
        sh: Math.max(svgRect.height, 1),
      })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    ro.observe(svg)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [showRulers, scale, camera.x, camera.y])

  const tickLen = (major: boolean) => (major ? 8 : 4)

  const hTicks: Array<{ pos: number; major: boolean; label?: string }> = []
  const vTicks: Array<{ pos: number; major: boolean; label?: string }> = []
  if (showRulers) {
    const step = doc.settings.gridSize > 0 ? doc.settings.gridSize : 16
    const majorEvery = 5
    let i = 0
    for (
      let x = Math.ceil(view.vx / step) * step;
      x <= view.vx + view.vw;
      x += step
    ) {
      const screen = view.ox + ((x - view.vx) / view.vw) * view.sw
      hTicks.push({
        pos: screen,
        major: i % majorEvery === 0,
        label: i % majorEvery === 0 ? String(Math.round(x)) : undefined,
      })
      i++
    }
    i = 0
    for (
      let y = Math.ceil(view.vy / step) * step;
      y <= view.vy + view.vh;
      y += step
    ) {
      const screen = view.oy + ((y - view.vy) / view.vh) * view.sh
      vTicks.push({
        pos: screen,
        major: i % majorEvery === 0,
        label: i % majorEvery === 0 ? String(Math.round(y)) : undefined,
      })
      i++
    }
  }

  const docPointFromClient = (clientX: number, clientY: number) => {
    const svg = canvasRef.current?.querySelector('.artboard-svg') as SVGSVGElement | null
    if (!svg) {
      return {
        x: camera.x + (clientX - (hostRef.current?.getBoundingClientRect().left ?? 0) - RULER) / scale,
        y: camera.y + (clientY - (hostRef.current?.getBoundingClientRect().top ?? 0) - RULER) / scale,
      }
    }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) {
      const svgRect = svg.getBoundingClientRect()
      return {
        x: camera.x + (clientX - svgRect.left) / scale,
        y: camera.y + (clientY - svgRect.top) / scale,
      }
    }
    const local = pt.matrixTransform(ctm.inverse())
    return { x: local.x, y: local.y }
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
    <div
      ref={hostRef}
      className={`rulers-host${showRulers ? '' : ' rulers-host--hidden'}`}
    >
      <div className="ruler ruler--corner" aria-hidden={!showRulers} />
      <div
        className="ruler ruler--h"
        onPointerDown={showRulers ? onHRulerDown : undefined}
        aria-hidden={!showRulers}
      >
        {hTicks.map((t, idx) => (
          <span
            key={`h${idx}`}
            className={`ruler__tick${t.major ? ' ruler__tick--major' : ''}`}
            style={{ left: t.pos, height: tickLen(t.major) }}
          />
        ))}
        {hTicks.map((t, idx) =>
          t.label ? (
            <span
              key={`hl${idx}`}
              className="ruler__label"
              style={{ left: t.pos }}
            >
              {t.label}
            </span>
          ) : null,
        )}
      </div>
      <div
        className="ruler ruler--v"
        onPointerDown={showRulers ? onVRulerDown : undefined}
        aria-hidden={!showRulers}
      >
        {vTicks.map((t, idx) => (
          <span
            key={`v${idx}`}
            className={`ruler__tick ruler__tick--v${t.major ? ' ruler__tick--major' : ''}`}
            style={{ top: t.pos, width: tickLen(t.major) }}
          />
        ))}
        {vTicks.map((t, idx) =>
          t.label ? (
            <span
              key={`vl${idx}`}
              className="ruler__label ruler__label--v"
              style={{ top: t.pos }}
            >
              {t.label}
            </span>
          ) : null,
        )}
      </div>
      <div ref={canvasRef} className="rulers-host__canvas">
        {children}
      </div>
    </div>
  )
}
