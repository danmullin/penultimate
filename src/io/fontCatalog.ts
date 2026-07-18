export type FontOption = {
  /** CSS font-family value stored on the text node. */
  value: string
  /** Short label in the picker. */
  label: string
}

/** Curated cross-platform fallbacks when Local Font Access isn't available. */
export const FALLBACK_FONTS: FontOption[] = [
  { value: 'Segoe UI, system-ui, sans-serif', label: 'Segoe UI' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { value: 'Calibri, Candara, sans-serif', label: 'Calibri' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
  { value: 'Palatino Linotype, Palatino, serif', label: 'Palatino' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'Lucida Console, monospace', label: 'Lucida Console' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
  { value: 'Impact, Charcoal, sans-serif', label: 'Impact' },
  { value: 'Brush Script MT, cursive', label: 'Brush Script MT' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
]

type LocalFont = { family: string; fullName?: string }

type FontCatalogState = {
  fonts: FontOption[]
  loading: boolean
  fromSystem: boolean
}

type Listener = (state: FontCatalogState) => void

let state: FontCatalogState = {
  fonts: FALLBACK_FONTS,
  // Fallbacks are ready immediately — system catalog upgrades in the background.
  loading: false,
  fromSystem: false,
}

const listeners = new Set<Listener>()
let loadStarted = false
let loadPromise: Promise<void> | null = null

function emit() {
  for (const listener of listeners) listener(state)
}

async function querySystemFonts(): Promise<FontOption[] | null> {
  const w = window as Window & {
    queryLocalFonts?: () => Promise<LocalFont[]>
  }
  if (typeof w.queryLocalFonts !== 'function') return null
  try {
    const fonts = await w.queryLocalFonts()
    const seen = new Set<string>()
    const options: FontOption[] = []
    for (const f of fonts) {
      const family = f.family?.trim()
      if (!family || seen.has(family)) continue
      seen.add(family)
      options.push({
        value: `"${family.replace(/"/g, '')}", sans-serif`,
        label: family,
      })
    }
    options.sort((a, b) => a.label.localeCompare(b.label))
    return options.length ? options : null
  } catch {
    return null
  }
}

/** Kick off Local Font Access in the background so Type tool isn't cold. */
export function preloadFontCatalog(): Promise<void> {
  if (loadPromise) return loadPromise
  loadStarted = true
  loadPromise = (async () => {
    const system = await querySystemFonts()
    if (!system) return
    // Apply the large system list off the critical path so the first Type
    // click isn't competing with a 100+ option <select> rebuild.
    const apply = () => {
      state = { fonts: system, loading: false, fromSystem: true }
      emit()
    }
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => apply(), { timeout: 3000 })
    } else {
      window.setTimeout(apply, 0)
    }
  })()
  return loadPromise
}

export function getFontCatalog(): FontCatalogState {
  if (!loadStarted) void preloadFontCatalog()
  return state
}

export function subscribeFontCatalog(listener: Listener): () => void {
  listeners.add(listener)
  if (!loadStarted) void preloadFontCatalog()
  return () => {
    listeners.delete(listener)
  }
}

/** Warm SVG text measurement path used by the type overlay. */
export function warmTextMetrics(): void {
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none'
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    probe.setAttribute('x', '0')
    probe.setAttribute('y', '0')
    probe.setAttribute('font-size', '24')
    probe.setAttribute('font-family', 'Segoe UI, system-ui, sans-serif')
    probe.textContent = 'Hg'
    svg.appendChild(probe)
    document.body.appendChild(svg)
    void probe.getBBox()
    document.body.removeChild(svg)
  } catch {
    /* ignore */
  }
}

/** Schedule font + metrics warm-up after first paint. */
export function scheduleTextToolWarmup(): void {
  // Metrics are cheap — do them ASAP so the first Type click isn't cold.
  warmTextMetrics()
  const loadFonts = () => {
    void preloadFontCatalog()
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => loadFonts(), { timeout: 2000 })
  } else {
    window.setTimeout(loadFonts, 300)
  }
}
