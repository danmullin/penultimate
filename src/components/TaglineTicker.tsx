import { useEffect, useMemo, useState } from 'react'
import { TAGLINES } from '../data/taglines'

const INTERVAL_MS = 6500
const TRANSITION_MS = 420

function shuffleRest(canonical: string, rest: string[]): string[] {
  const pool = rest.filter((t) => t !== canonical)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return [canonical, ...pool]
}

/**
 * News-ticker style tagline under the brand — slides out / in on a timer.
 */
export function TaglineTicker() {
  const lineup = useMemo(
    () => shuffleRest('Handles worth dragging', TAGLINES),
    [],
  )
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'in' | 'shown' | 'out'>('shown')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = window.setInterval(() => {
        setIndex((i) => (i + 1) % lineup.length)
      }, INTERVAL_MS)
      return () => window.clearInterval(id)
    }

    let outTimer: number | undefined
    let inTimer: number | undefined
    const tick = window.setInterval(() => {
      setPhase('out')
      outTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % lineup.length)
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
  }, [lineup.length])

  const text = lineup[index] ?? TAGLINES[0]!

  return (
    <span className="menu-bar__tagline-slot" title={text} aria-live="polite">
      <span
        className={`menu-bar__tagline menu-bar__tagline--${phase}`}
        key={index}
      >
        {text}
      </span>
    </span>
  )
}
