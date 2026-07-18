import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  FALLBACK_FONTS,
  getFontCatalog,
  subscribeFontCatalog,
  type FontOption,
} from '../io/fontCatalog'

export type { FontOption }
export { FALLBACK_FONTS }

const ROW_PX = 28
const VIEWPORT_ROWS = 8
const OVERSCAN = 3

/** Ensure the current value appears in the list even if custom / imported. */
export function withCurrentFont(fonts: FontOption[], current: string): FontOption[] {
  if (!current) return fonts
  if (fonts.some((f) => f.value === current)) return fonts
  const label = current.split(',')[0]?.replace(/["']/g, '').trim() || current
  return [{ value: current, label }, ...fonts]
}

export function useFontOptions(): {
  fonts: FontOption[]
  loading: boolean
  fromSystem: boolean
} {
  return useSyncExternalStore(subscribeFontCatalog, getFontCatalog, getFontCatalog)
}

function warmFontFace(family: string): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return Promise.resolve()
  }
  return document.fonts.load(`16px ${family}`).then(
    () => undefined,
    () => undefined,
  )
}

export function FontSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (fontFamily: string) => void
  disabled?: boolean
}) {
  const { fonts, loading, fromSystem } = useFontOptions()
  const [filter, setFilter] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  /** Families that have been warmed (or are on-screen and styled). */
  const [previewed, setPreviewed] = useState(() => new Set<string>())
  const listRef = useRef<HTMLDivElement>(null)
  const warmGen = useRef(0)

  const options = useMemo(() => withCurrentFont(fonts, value), [fonts, value])
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return options
    return options.filter((f) => f.label.toLowerCase().includes(q))
  }, [options, filter])

  const selectedIndex = Math.max(
    0,
    filtered.findIndex((f) => f.value === value),
  )

  const start = Math.max(0, Math.floor(scrollTop / ROW_PX) - OVERSCAN)
  const end = Math.min(
    filtered.length,
    Math.ceil((scrollTop + VIEWPORT_ROWS * ROW_PX) / ROW_PX) + OVERSCAN,
  )
  const visible = filtered.slice(start, end)

  // On-screen rows: mark previewed + kick document.fonts.load so faces resolve fast.
  useEffect(() => {
    if (disabled || visible.length === 0) return
    let cancelled = false
    const pending = visible.filter((f) => !previewed.has(f.value))
    if (pending.length === 0) return

    setPreviewed((prev) => {
      const next = new Set(prev)
      for (const f of pending) next.add(f.value)
      return next
    })

    void (async () => {
      for (const f of pending) {
        if (cancelled) return
        await warmFontFace(f.value)
      }
    })()

    return () => {
      cancelled = true
    }
    // previewed intentionally omitted — we only care about newly visible rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, filtered, disabled])

  // While searching / after list changes: warm the rest of the filtered set idle.
  useEffect(() => {
    if (disabled) return
    const gen = ++warmGen.current
    const queue = filtered.filter((f) => !previewed.has(f.value))
    if (queue.length === 0) return

    let cancelled = false
    let index = 0

    const pump = () => {
      if (cancelled || gen !== warmGen.current) return
      const batch = queue.slice(index, index + 6)
      if (batch.length === 0) return
      index += batch.length
      void Promise.all(batch.map((f) => warmFontFace(f.value))).then(() => {
        if (cancelled || gen !== warmGen.current) return
        setPreviewed((prev) => {
          const next = new Set(prev)
          for (const f of batch) next.add(f.value)
          return next
        })
        schedule()
      })
    }

    const schedule = () => {
      if (cancelled || gen !== warmGen.current) return
      if (index >= queue.length) return
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => pump(), { timeout: 400 })
      } else {
        window.setTimeout(pump, 24)
      }
    }

    // Slight delay so rapid filter typing doesn't thrash loads.
    const delay = window.setTimeout(schedule, filter ? 120 : 280)
    return () => {
      cancelled = true
      window.clearTimeout(delay)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, filtered, disabled])

  // Keep the selected font scrolled into view when it changes externally.
  useEffect(() => {
    const el = listRef.current
    if (!el || selectedIndex < 0) return
    const top = selectedIndex * ROW_PX
    const bottom = top + ROW_PX
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + VIEWPORT_ROWS * ROW_PX) {
      el.scrollTop = bottom - VIEWPORT_ROWS * ROW_PX
    }
  }, [selectedIndex, value])

  const stepFont = (delta: number) => {
    if (disabled || filtered.length === 0) return
    const from = selectedIndex >= 0 ? selectedIndex : 0
    const next = Math.min(filtered.length - 1, Math.max(0, from + delta))
    const pick = filtered[next]
    if (pick && pick.value !== value) onChange(pick.value)
  }

  return (
    <div className="font-select">
      <div className="font-select__row">
        <input
          className="font-select__filter"
          type="search"
          placeholder={loading ? 'Loading fonts…' : fromSystem ? 'Search fonts…' : 'Search…'}
          value={filter}
          disabled={disabled}
          onChange={(e) => {
            setFilter(e.target.value)
            setScrollTop(0)
            if (listRef.current) listRef.current.scrollTop = 0
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              stepFont(1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              stepFont(-1)
            }
          }}
          aria-label="Filter fonts"
        />
      </div>
      <div
        ref={listRef}
        className="font-select__list"
        role="listbox"
        aria-label="Font family"
        aria-activedescendant={
          filtered[selectedIndex] ? `font-opt-${selectedIndex}` : undefined
        }
        tabIndex={disabled ? -1 : 0}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            e.stopPropagation()
            stepFont(1)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            e.stopPropagation()
            stepFont(-1)
          } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            e.preventDefault()
            onChange(filtered[selectedIndex]!.value)
          }
        }}
      >
        <div
          className="font-select__spacer"
          style={{ height: Math.max(filtered.length, 1) * ROW_PX }}
        >
          {visible.map((f, i) => {
            const index = start + i
            const selected = f.value === value
            const showFace = previewed.has(f.value)
            return (
              <button
                key={f.value}
                type="button"
                role="option"
                id={`font-opt-${index}`}
                aria-selected={selected}
                disabled={disabled}
                className={`font-select__option${selected ? ' is-selected' : ''}`}
                style={{
                  top: index * ROW_PX,
                  height: ROW_PX,
                  fontFamily: showFace ? f.value : undefined,
                }}
                onClick={() => onChange(f.value)}
              >
                {f.label}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="font-select__empty">No fonts match</div>
          )}
        </div>
      </div>
      <div className="font-select__preview" style={{ fontFamily: value }}>
        The quick brown fox
      </div>
      {!fromSystem && !loading && (
        <p className="font-select__hint">
          Showing common fonts. Chrome can offer your installed fonts if you allow Local Font Access.
        </p>
      )}
    </div>
  )
}
