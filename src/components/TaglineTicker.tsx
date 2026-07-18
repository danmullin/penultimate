import { useEffect, useRef, useState } from 'react'
import { TAGLINES } from '../data/taglines'

const INTERVAL_MS = 14000
const TRANSITION_MS = 420
const STORAGE_KEY = 'penultimate-tagline-ticker-v2'

type Stored = {
  order?: string[]
  index?: number
  text?: string
}

function shuffleRest(canonical: string, rest: string[]): string[] {
  const pool = rest.filter((t) => t !== canonical)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return [canonical, ...pool]
}

/** Merge saved order with current TAGLINES (keep progress, add new, drop removed). */
function mergeOrder(saved: string[] | undefined): string[] {
  const known = new Set(TAGLINES)
  const order = (saved ?? []).filter((t) => known.has(t))
  for (const t of TAGLINES) {
    if (!order.includes(t)) order.push(t)
  }
  if (order.length === 0) {
    return shuffleRest('Handles worth dragging', TAGLINES)
  }
  return order
}

function readStored(): { lineup: string[]; index: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Stored
      const lineup = mergeOrder(parsed.order)
      let index = 0
      if (typeof parsed.text === 'string') {
        const byText = lineup.indexOf(parsed.text)
        if (byText >= 0) index = byText
      } else if (typeof parsed.index === 'number' && Number.isFinite(parsed.index)) {
        index = ((parsed.index % lineup.length) + lineup.length) % lineup.length
      }
      return { lineup, index }
    }
  } catch {
    /* ignore */
  }
  return {
    lineup: shuffleRest('Handles worth dragging', TAGLINES),
    index: 0,
  }
}

function writeStored(lineup: string[], index: number) {
  try {
    const text = lineup[index] ?? lineup[0] ?? ''
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: lineup, index, text } satisfies Stored),
    )
  } catch {
    /* ignore */
  }
}

/**
 * News-ticker style tagline under the brand — slides out / in on a timer.
 * Remembers the current line + rotation order in localStorage.
 */
export function TaglineTicker() {
  const boot = useRef(readStored())
  const lineupRef = useRef(boot.current.lineup)
  const [index, setIndex] = useState(boot.current.index)
  const [phase, setPhase] = useState<'in' | 'shown' | 'out'>('shown')

  useEffect(() => {
    writeStored(lineupRef.current, index)
  }, [index])

  useEffect(() => {
    const lineup = lineupRef.current
    const advance = () => {
      setIndex((i) => (i + 1) % lineup.length)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = window.setInterval(advance, INTERVAL_MS)
      return () => window.clearInterval(id)
    }

    let outTimer: number | undefined
    let inTimer: number | undefined
    const tick = window.setInterval(() => {
      setPhase('out')
      outTimer = window.setTimeout(() => {
        advance()
        setPhase('in')
        inTimer = window.setTimeout(() => {
          requestAnimationFrame(() => setPhase('shown'))
        }, 40)
      }, TRANSITION_MS)
    }, INTERVAL_MS)

    return () => {
      window.clearInterval(tick)
      if (outTimer) window.clearTimeout(outTimer)
      if (inTimer) window.clearTimeout(inTimer)
    }
  }, [])

  const text = lineupRef.current[index] ?? TAGLINES[0]!

  return (
    <span className="menu-bar__tagline-slot" title={text} aria-live="polite">
      <span className={`menu-bar__tagline menu-bar__tagline--${phase}`} key={index}>
        {text}
      </span>
    </span>
  )
}
