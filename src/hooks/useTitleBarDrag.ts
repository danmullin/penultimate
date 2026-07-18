import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type DragPos = { left: number; top: number }

/**
 * Drag a fixed/absolute panel from its title bar.
 * Ignores pointer downs on interactive children (buttons, inputs, …).
 */
export function useTitleBarDrag(initial?: DragPos | null) {
  const [pos, setPos] = useState<DragPos | null>(initial ?? null)
  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    origLeft: number
    origTop: number
  } | null>(null)

  const reset = useCallback((next: DragPos | null = null) => {
    drag.current = null
    setPos(next)
  }, [])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    const t = e.target as Element
    if (t.closest('button, a, input, select, textarea, label')) return

    const handle = e.currentTarget
    const panel = handle.closest('[data-drag-panel]') as HTMLElement | null
    if (!panel) return

    e.preventDefault()
    e.stopPropagation()

    const rect = panel.getBoundingClientRect()
    const left = pos?.left ?? rect.left
    const top = pos?.top ?? rect.top
    setPos({ left, top })
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: left,
      origTop: top,
    }
    handle.setPointerCapture(e.pointerId)
  }, [pos])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const pad = 8
    const panel = (e.currentTarget.closest('[data-drag-panel]') as HTMLElement | null)
    const w = panel?.offsetWidth ?? 0
    let left = d.origLeft + (e.clientX - d.startX)
    let top = d.origTop + (e.clientY - d.startY)
    left = Math.min(window.innerWidth - pad - Math.min(w, 40), Math.max(pad - Math.max(0, w - 80), left))
    top = Math.min(window.innerHeight - pad - 40, Math.max(pad, top))
    setPos({ left, top })
  }, [])

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }, [])

  return {
    pos,
    setPos,
    reset,
    titleBarProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
