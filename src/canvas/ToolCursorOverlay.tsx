import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { assetUrl } from '../assetUrl'
import type { Tool } from '../types'
import { cursorForTool, type CursorName } from './toolCursors'

const HOTSPOT: Record<CursorName, { x: number; y: number }> = {
  select: { x: 5, y: 2 },
  direct: { x: 5, y: 2 },
  pen: { x: 4, y: 28 },
  'pen-add': { x: 4, y: 28 },
  'pen-remove': { x: 4, y: 28 },
  'pen-close': { x: 4, y: 28 },
  pencil: { x: 4, y: 28 },
  eyedropper: { x: 5, y: 28 },
  text: { x: 16, y: 16 },
  'area-text': { x: 16, y: 16 },
  line: { x: 16, y: 16 },
  rect: { x: 16, y: 16 },
  'rounded-rect': { x: 16, y: 16 },
  ellipse: { x: 16, y: 16 },
  polygon: { x: 16, y: 16 },
  star: { x: 16, y: 16 },
  move: { x: 16, y: 16 },
  precision: { x: 16, y: 16 },
  scissors: { x: 16, y: 16 },
  shear: { x: 16, y: 16 },
  zoom: { x: 11, y: 11 },
  hand: { x: 16, y: 16 },
  'hand-closed': { x: 16, y: 16 },
}

/**
 * Illustrator-style tool cursor.
 * Uses position:fixed + client coords so it never expands scroll containers.
 */
export function ToolCursorOverlay({
  tool,
  hostRef,
  override,
}: {
  tool: Tool
  hostRef: RefObject<HTMLElement | null>
  override?: CursorName | null
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const nameRef = useRef<CursorName>(cursorForTool(tool))
  const hotRef = useRef(HOTSPOT[nameRef.current])
  const name = override ?? cursorForTool(tool)

  useLayoutEffect(() => {
    nameRef.current = name
    hotRef.current = HOTSPOT[name]
    const img = imgRef.current
    if (img) img.src = assetUrl(`cursors/${name}.svg`)
  }, [name])

  useEffect(() => {
    const host = hostRef.current
    const img = imgRef.current
    if (!host || !img) return

    const place = (clientX: number, clientY: number) => {
      const hot = hotRef.current
      img.style.transform = `translate3d(${clientX - hot.x}px, ${clientY - hot.y}px, 0)`
    }

    const hide = () => {
      img.style.opacity = '0'
      // Park off-screen so a zero-opacity cursor can't create overflow/hit targets
      img.style.transform = 'translate3d(-100px, -100px, 0)'
    }

    const onMove = (e: PointerEvent) => {
      const overChrome =
        e.target instanceof Element &&
        Boolean(e.target.closest('.sel-handle, .sel-move, .sel-rotate'))
      if (overChrome) {
        hide()
        return
      }
      img.style.opacity = '1'
      place(e.clientX, e.clientY)
    }
    const onEnter = (e: PointerEvent) => {
      const overChrome =
        e.target instanceof Element &&
        Boolean(e.target.closest('.sel-handle, .sel-move, .sel-rotate'))
      if (overChrome) {
        hide()
        return
      }
      img.style.opacity = '1'
      place(e.clientX, e.clientY)
    }

    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerenter', onEnter, { passive: true })
    host.addEventListener('pointerleave', hide, { passive: true })
    return () => {
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerenter', onEnter)
      host.removeEventListener('pointerleave', hide)
    }
  }, [hostRef])

  return (
    <img
      ref={imgRef}
      className="tool-cursor"
      src={assetUrl(`cursors/${name}.svg`)}
      alt=""
      width={32}
      height={32}
      draggable={false}
    />
  )
}
