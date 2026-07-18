import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useDocStore } from '../store/documentStore'
import type { TextNode, Paint } from '../types'

type Props = {
  nodeId: string
  hostRef: RefObject<HTMLDivElement | null>
  svgRef: RefObject<SVGSVGElement | null>
  isNew: boolean
  onLiveChange: (text: string) => void
  onCommit: (text: string) => void
  onCancel: () => void
}

type Layout = {
  left: number
  top: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  rotation: number
  minWidth: number
  color: string
  /** Distance from box top to alphabetic baseline (screen px). */
  ascent: number
  height: number
}

function fillColor(fill: Paint): string {
  return fill.type === 'solid' ? fill.color : '#000000'
}

/** SVG getBBox metrics with baseline at y=0 — matches committed <text> rendering. */
function measureSvgTextMetrics(
  svg: SVGSVGElement,
  node: TextNode,
): { ascent: number; descent: number } {
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  probe.setAttribute('x', '0')
  probe.setAttribute('y', '0')
  probe.setAttribute('font-size', String(node.fontSize))
  probe.setAttribute('font-family', node.fontFamily)
  probe.setAttribute('font-weight', String(node.fontWeight))
  probe.setAttribute('font-style', node.fontStyle)
  probe.textContent = (node.text && node.text.trim()) || 'Hg'
  probe.setAttribute('visibility', 'hidden')
  probe.style.pointerEvents = 'none'
  svg.appendChild(probe)
  let ascent = node.fontSize * 0.8
  let descent = node.fontSize * 0.2
  try {
    const b = probe.getBBox()
    ascent = Math.max(1, -b.y)
    descent = Math.max(0, b.height + b.y)
  } catch {
    /* empty */
  }
  svg.removeChild(probe)
  return { ascent, descent }
}

function layoutForText(
  node: TextNode,
  host: HTMLDivElement,
  svg: SVGSVGElement,
): Layout | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const hostRect = host.getBoundingClientRect()
  const isArea = Boolean(node.width && node.height && node.width > 0 && node.height > 0)
  const pt = svg.createSVGPoint()
  pt.x = node.x
  // Point text: node.y is SVG alphabetic baseline. Area text: top of frame.
  pt.y = isArea ? node.y : node.y
  const screen = pt.matrixTransform(ctm)
  const scale = Math.hypot(ctm.a, ctm.b) || 1
  const { ascent, descent } = isArea
    ? { ascent: 0, descent: node.fontSize }
    : measureSvgTextMetrics(svg, node)
  const ascentPx = ascent * scale
  const heightPx = isArea
    ? Math.max(node.fontSize * scale * 1.2, (node.height ?? 40) * scale)
    : (ascent + descent) * scale
  return {
    left: screen.x - hostRect.left + host.scrollLeft,
    top: screen.y - hostRect.top + host.scrollTop - (isArea ? 0 : ascentPx),
    fontSize: node.fontSize * scale,
    fontFamily: node.fontFamily,
    fontWeight: node.fontWeight,
    fontStyle: node.fontStyle,
    rotation: node.rotation,
    minWidth: Math.max(12, node.fontSize * scale * 0.5),
    color: fillColor(node.style.fill),
    ascent: ascentPx,
    height: heightPx,
  }
}

function focusField(el: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!el) return
  if (document.activeElement === el) return
  el.focus({ preventScroll: true })
}

export function TextEditOverlay({
  nodeId,
  hostRef,
  svgRef,
  isNew,
  onLiveChange,
  onCommit,
  onCancel,
}: Props) {
  const node = useDocStore((s) => s.doc.nodes[nodeId])
  const zoom = useDocStore((s) => s.zoom)
  const [value, setValue] = useState(() =>
    node?.type === 'text' ? node.text : '',
  )
  const [layout, setLayout] = useState<Layout | null>(null)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const committed = useRef(false)
  const armed = useRef(false)
  const valueRef = useRef(value)
  const onCommitRef = useRef(onCommit)
  const onCancelRef = useRef(onCancel)
  const onLiveChangeRef = useRef(onLiveChange)
  valueRef.current = value
  onCommitRef.current = onCommit
  onCancelRef.current = onCancel
  onLiveChangeRef.current = onLiveChange

  const finish = (text: string, cancel: boolean) => {
    if (committed.current) return
    committed.current = true
    if (cancel) onCancelRef.current()
    else onCommitRef.current(text)
  }

  // Position/size from geometry + zoom only — not text value (keeps typing snappy).
  useLayoutEffect(() => {
    const host = hostRef.current
    const svg = svgRef.current
    if (!host || !svg || !node || node.type !== 'text') {
      setLayout(null)
      return
    }
    setLayout(layoutForText(node, host, svg))
  }, [
    nodeId,
    zoom,
    hostRef,
    svgRef,
    node && node.type === 'text' ? node.x : null,
    node && node.type === 'text' ? node.y : null,
    node && node.type === 'text' ? node.width : null,
    node && node.type === 'text' ? node.height : null,
    node && node.type === 'text' ? node.fontSize : null,
    node && node.type === 'text' ? node.fontFamily : null,
    node && node.type === 'text' ? node.fontWeight : null,
    node && node.type === 'text' ? node.fontStyle : null,
    node && node.type === 'text' ? node.rotation : null,
    node && node.type === 'text' ? fillColor(node.style.fill) : null,
  ])

  // Focus only after the field exists (layout resolved). Reclaim if chrome steals it.
  useLayoutEffect(() => {
    if (!layout) return
    committed.current = false
    armed.current = false

    const claimFocus = () => {
      const el = fieldRef.current
      focusField(el)
      if (el && !isNew && valueRef.current && 'select' in el) {
        // Only select-all on first claim for existing text.
      }
    }

    claimFocus()
    if (!isNew && valueRef.current) {
      const el = fieldRef.current
      if (el && 'select' in el) el.select()
    }

    const raf = window.requestAnimationFrame(claimFocus)
    const t0 = window.setTimeout(claimFocus, 0)
    const t1 = window.setTimeout(claimFocus, 32)
    const armTimer = window.setTimeout(() => {
      armed.current = true
    }, 0)

    const onPointerDownCapture = (e: PointerEvent) => {
      if (!armed.current || committed.current) return
      const field = fieldRef.current
      if (!field) return
      if (e.target instanceof Node && field.contains(e.target)) return
      finish(valueRef.current, false)
    }

    // If focus slips to a tool button / panel, reclaim printable keys into the field.
    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (committed.current) return
      const field = fieldRef.current
      if (!field) return
      if (e.target === field || (e.target instanceof Node && field.contains(e.target))) {
        return
      }
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        finish(valueRef.current, false)
        return
      }
      if (e.key === 'Enter' && field instanceof HTMLInputElement) {
        e.preventDefault()
        e.stopPropagation()
        finish(valueRef.current, false)
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        e.stopPropagation()
        focusField(field)
        const next = valueRef.current.slice(0, -1)
        valueRef.current = next
        setValue(next)
        onLiveChangeRef.current(next)
        return
      }
      if (e.key.length === 1) {
        e.preventDefault()
        e.stopPropagation()
        focusField(field)
        const next = valueRef.current + e.key
        valueRef.current = next
        setValue(next)
        onLiveChangeRef.current(next)
      } else {
        focusField(field)
      }
    }

    window.addEventListener('pointerdown', onPointerDownCapture, true)
    window.addEventListener('keydown', onKeyDownCapture, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.clearTimeout(armTimer)
      window.removeEventListener('pointerdown', onPointerDownCapture, true)
      window.removeEventListener('keydown', onKeyDownCapture, true)
      armed.current = false
    }
  }, [layout, nodeId, isNew])

  if (!node || node.type !== 'text' || !layout) return null

  const isArea = Boolean(node.width && node.height && node.width > 0 && node.height > 0)
  const scale = layout.fontSize / Math.max(1, node.fontSize)

  const onBlur = () => {
    if (!armed.current) return
    window.setTimeout(() => {
      if (committed.current) return
      if (document.activeElement === fieldRef.current) return
      // Don't commit just because a panel stole focus — reclaim instead.
      focusField(fieldRef.current)
    }, 0)
  }

  const shared = {
    className: `text-edit-overlay${isArea ? ' text-edit-overlay--area' : ' text-edit-overlay--point'}`,
    value,
    spellCheck: false as const,
    autoFocus: true,
    style: {
      left: layout.left,
      top: layout.top,
      fontSize: layout.fontSize,
      fontFamily: layout.fontFamily,
      fontWeight: layout.fontWeight,
      fontStyle: layout.fontStyle,
      minWidth: layout.minWidth,
      // Glyphs stay in SVG underneath — overlay is caret + hit target only.
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      caretColor: 'var(--accent-strong)',
      transform: layout.rotation ? `rotate(${layout.rotation}deg)` : undefined,
      transformOrigin: isArea ? '0 0' : `0 ${layout.ascent}px`,
      ...(isArea
        ? {
            width: Math.max(layout.minWidth, (node.width ?? 40) * scale),
            height: Math.max(layout.fontSize * 1.2, (node.height ?? 40) * scale),
            resize: 'none' as const,
          }
        : {
            width: `max(${layout.minWidth}px, ${Math.max(1, value.length + 1)}ch)`,
            height: `${layout.height}px`,
          }),
    },
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const next = e.target.value
      setValue(next)
      onLiveChange(next)
    },
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onBlur,
  }

  if (isArea) {
    return (
      <textarea
        {...shared}
        ref={fieldRef as RefObject<HTMLTextAreaElement>}
        aria-label="Edit area text"
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') {
            e.preventDefault()
            finish(value, false)
          }
        }}
      />
    )
  }

  return (
    <input
      {...shared}
      ref={fieldRef as RefObject<HTMLInputElement>}
      aria-label="Edit text"
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(value, false)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          finish(value, false)
        }
      }}
    />
  )
}
