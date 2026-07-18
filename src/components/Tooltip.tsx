import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'

type TipState = { text: string; anchor: DOMRect }

let tipSetter: ((tip: TipState | null) => void) | null = null

const PAD = 8

/** Mount once near the app root — renders the floating tip. */
export function TooltipHost() {
  const [tip, setTip] = useState<TipState | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    tipSetter = setTip
    return () => {
      if (tipSetter === setTip) tipSetter = null
    }
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!tip || !el) return

    const tw = el.offsetWidth
    const th = el.offsetHeight
    const { innerWidth: vw, innerHeight: vh } = window
    const a = tip.anchor

    // Prefer below the anchor; flip above if it would clip the bottom.
    let y = a.bottom + PAD
    if (y + th > vh - PAD) {
      y = a.top - PAD - th
    }
    if (y < PAD) y = PAD
    if (y + th > vh - PAD) y = Math.max(PAD, vh - PAD - th)

    // x is the horizontal center (CSS uses translateX(-50%)).
    let x = a.left + a.width / 2
    const half = tw / 2
    x = Math.min(vw - PAD - half, Math.max(PAD + half, x))

    el.style.left = `${x}px`
    el.style.top = `${y}px`
  }, [tip])

  if (!tip) return null
  return createPortal(
    <div ref={ref} className="ui-tooltip" role="tooltip">
      {tip.text}
    </div>,
    document.body,
  )
}

function showTip(text: string, anchor: DOMRect) {
  if (!text || !tipSetter) return
  tipSetter({ text, anchor })
}

function hideTip() {
  tipSetter?.(null)
}

/** Pointer handlers for instant tooltips (no native title delay). */
export function useTooltip(text: string) {
  const onPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      showTip(text, e.currentTarget.getBoundingClientRect())
    },
    [text],
  )
  const onPointerLeave = useCallback(() => hideTip(), [])
  const onPointerDown = useCallback(() => hideTip(), [])
  return { onPointerEnter, onPointerLeave, onPointerDown }
}
