import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { selectionBBox } from '../geometry'
import { useDocStore } from '../store/documentStore'
import { isCreateTool } from './NodeViews'

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | 'rotate'

type DragState = {
  kind: 'move' | Handle
  startClientX: number
  startClientY: number
  originBox: { x: number; y: number; width: number; height: number }
  originRotation: number
  startPointerAngle: number
  svg: SVGSVGElement
}

function svgLocalFromClient(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
): { x: number; y: number } | null {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const local = pt.matrixTransform(ctm.inverse())
  return { x: local.x, y: local.y }
}

function ownerSvg(el: Element): SVGSVGElement | null {
  if (el instanceof SVGSVGElement) return el
  if (el instanceof SVGElement) return el.ownerSVGElement
  return null
}

function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  deg: number,
): { x: number; y: number } {
  const r = (deg * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const dx = x - cx
  const dy = y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

export function SelectionOverlay({
  scale,
  onEditText,
}: {
  scale: number
  onEditText?: (id: string) => void
}) {
  const doc = useDocStore((s) => s.doc)
  const selectedIds = useDocStore((s) => s.selectedIds)
  const tool = useDocStore((s) => s.tool)
  const aspectLock = useDocStore((s) => s.aspectLock)
  const pushHistory = useDocStore((s) => s.pushHistory)
  const moveSelectedTo = useDocStore((s) => s.moveSelectedTo)
  const resizeSelectionTo = useDocStore((s) => s.resizeSelectionTo)
  const rotateSelected = useDocStore((s) => s.rotateSelected)
  const setGuides = useDocStore((s) => s.setGuides)

  const drag = useRef<DragState | null>(null)
  const scaleRef = useRef(scale)
  const aspectLockRef = useRef(aspectLock)
  scaleRef.current = scale
  aspectLockRef.current = aspectLock

  const [rotatePointer, setRotatePointer] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [rotating, setRotating] = useState(false)
  // Delay hit-testing so a double-click to edit text isn't eaten by the
  // selection chrome that mounts after the first click.
  const [interactive, setInteractive] = useState(false)

  useEffect(() => {
    setInteractive(false)
    const t = window.setTimeout(() => setInteractive(true), 280)
    return () => window.clearTimeout(t)
  }, [selectedIds.join('|')])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const s = scaleRef.current
      const dx = (e.clientX - d.startClientX) / s
      const dy = (e.clientY - d.startClientY) / s

      if (d.kind === 'move') {
        moveSelectedTo(d.originBox.x + dx, d.originBox.y + dy)
        return
      }

      if (d.kind === 'rotate') {
        const local = svgLocalFromClient(e.clientX, e.clientY, d.svg)
        if (!local) return
        setRotatePointer(local)
        const ocx = d.originBox.x + d.originBox.width / 2
        const ocy = d.originBox.y + d.originBox.height / 2
        const angleNow = Math.atan2(local.y - ocy, local.x - ocx)
        let deg =
          d.originRotation + ((angleNow - d.startPointerAngle) * 180) / Math.PI
        if (e.shiftKey) deg = Math.round(deg / 15) * 15
        rotateSelected(Math.round(deg))
        return
      }

      let { x, y, width, height } = d.originBox
      const kind = d.kind
      if (kind.includes('e')) width = Math.max(4, d.originBox.width + dx)
      if (kind.includes('s')) height = Math.max(4, d.originBox.height + dy)
      if (kind.includes('w')) {
        width = Math.max(4, d.originBox.width - dx)
        x = d.originBox.x + (d.originBox.width - width)
      }
      if (kind.includes('n')) {
        height = Math.max(4, d.originBox.height - dy)
        y = d.originBox.y + (d.originBox.height - height)
      }

      const lock = aspectLockRef.current || e.shiftKey
      if (lock && d.originBox.width > 0 && d.originBox.height > 0) {
        const ratio = d.originBox.width / d.originBox.height
        const isCorner =
          kind === 'nw' || kind === 'ne' || kind === 'sw' || kind === 'se'
        const isEdgeH = kind === 'e' || kind === 'w'
        const isEdgeV = kind === 'n' || kind === 's'

        if (isCorner || isEdgeH) {
          height = Math.max(4, width / ratio)
          if (kind.includes('n')) y = d.originBox.y + d.originBox.height - height
          if (kind === 'e' || kind === 'w') {
            y = d.originBox.y + (d.originBox.height - height) / 2
          }
        } else if (isEdgeV) {
          width = Math.max(4, height * ratio)
          x = d.originBox.x + (d.originBox.width - width) / 2
        }
      }

      resizeSelectionTo({ x, y, width, height })
    }

    const onUp = () => {
      if (!drag.current) return
      drag.current = null
      setRotatePointer(null)
      setRotating(false)
      setGuides([])
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [moveSelectedTo, resizeSelectionTo, rotateSelected, setGuides])

  if (selectedIds.length === 0) return null
  // Keep bounds visible after create / Type so Appearance still has a clear target
  // even while the create tool stays active (Illustrator-style).
  if (tool !== 'select' && tool !== 'text' && tool !== 'area-text' && !isCreateTool(tool)) {
    return null
  }
  const box = selectionBBox(selectedIds, doc)
  if (!box) return null

  const hs = 8 / scale
  const stroke = 1.5 / scale
  const stem = 24 / scale

  const selected = selectedIds.map((id) => doc.nodes[id]).filter(Boolean)
  const rotation = selected.length === 1 ? selected[0].rotation : 0
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const topCenter = rotatePoint(cx, box.y, cx, cy, rotation)
  const restHandle = rotatePoint(cx, box.y - stem, cx, cy, rotation)

  const beginDrag = (
    kind: 'move' | Handle,
    e: ReactPointerEvent,
    startPointerAngle = 0,
  ) => {
    if (selected.some((n) => n.locked)) return
    const svg = ownerSvg(e.currentTarget)
    if (!svg) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    pushHistory()
    drag.current = {
      kind,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originBox: { ...box },
      originRotation: rotation,
      startPointerAngle,
      svg,
    }
    if (kind === 'rotate') {
      setRotating(true)
      const local = svgLocalFromClient(e.clientX, e.clientY, svg)
      if (local) setRotatePointer(local)
    }
  }

  const onMoveDown = (e: ReactPointerEvent) => beginDrag('move', e)

  const onHandleDown = (kind: Handle) => (e: ReactPointerEvent) => {
    const svg = ownerSvg(e.currentTarget)
    if (!svg) return
    let startPointerAngle = -Math.PI / 2
    if (kind === 'rotate') {
      const local = svgLocalFromClient(e.clientX, e.clientY, svg)
      if (local) startPointerAngle = Math.atan2(local.y - cy, local.x - cx)
    }
    beginDrag(kind, e, startPointerAngle)
  }

  const handles: Array<{ kind: Handle; x: number; y: number; cursor: string }> = [
    { kind: 'nw', x: box.x, y: box.y, cursor: 'nwse-resize' },
    { kind: 'ne', x: box.x + box.width, y: box.y, cursor: 'nesw-resize' },
    { kind: 'sw', x: box.x, y: box.y + box.height, cursor: 'nesw-resize' },
    { kind: 'se', x: box.x + box.width, y: box.y + box.height, cursor: 'nwse-resize' },
    { kind: 'n', x: box.x + box.width / 2, y: box.y, cursor: 'ns-resize' },
    { kind: 's', x: box.x + box.width / 2, y: box.y + box.height, cursor: 'ns-resize' },
    { kind: 'w', x: box.x, y: box.y + box.height / 2, cursor: 'ew-resize' },
    { kind: 'e', x: box.x + box.width, y: box.y + box.height / 2, cursor: 'ew-resize' },
  ]

  const handlePos = rotating && rotatePointer ? rotatePointer : restHandle
  const soleText =
    selectedIds.length === 1 ? doc.nodes[selectedIds[0]] : null
  const soleTextId =
    soleText?.type === 'text' && !soleText.locked ? soleText.id : null
  const typeTool = tool === 'text' || tool === 'area-text'
  // Type tool: selection chrome is visual-only so clicks hit the text and enter edit.
  // Also non-interactive briefly after selection so dblclick reaches the node.
  const passClicksThrough = !interactive || typeTool

  return (
    <g>
      <g transform={`rotate(${rotation} ${cx} ${cy})`}>
        <rect
          className="sel-move"
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill="transparent"
          stroke="#c4a484"
          strokeWidth={stroke}
          strokeDasharray={`${4 / scale} ${4 / scale}`}
          pointerEvents={passClicksThrough ? 'none' : 'all'}
          onPointerDown={passClicksThrough ? undefined : onMoveDown}
          onDoubleClick={
            soleTextId
              ? (e) => {
                  e.stopPropagation()
                  onEditText?.(soleTextId)
                }
              : undefined
          }
        />
        {handles.map((h) => (
          <rect
            key={h.kind}
            className="sel-handle"
            data-cursor={h.cursor}
            x={h.x - hs / 2}
            y={h.y - hs / 2}
            width={hs}
            height={hs}
            fill="#221c17"
            stroke="#c4a484"
            strokeWidth={stroke}
            style={{ cursor: h.cursor }}
            pointerEvents={passClicksThrough ? 'none' : 'all'}
            onPointerDown={onHandleDown(h.kind)}
          />
        ))}
      </g>

      <line
        x1={topCenter.x}
        y1={topCenter.y}
        x2={handlePos.x}
        y2={handlePos.y}
        stroke="#c4a484"
        strokeWidth={stroke}
        pointerEvents="none"
      />
      <circle
        className="sel-rotate"
        cx={handlePos.x}
        cy={handlePos.y}
        r={hs / 1.5}
        fill="#e0b87a"
        style={{ cursor: rotating ? 'grabbing' : 'grab' }}
        pointerEvents={passClicksThrough ? 'none' : 'all'}
        onPointerDown={onHandleDown('rotate')}
      />
    </g>
  )
}
