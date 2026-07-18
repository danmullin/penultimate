import { useCallback, useEffect, useState } from 'react'

export type UiTheme =
  | 'coffee'
  | 'synthwave'
  | 'illustrator'
  | 'paper'
  | 'nord'
  | 'matcha'
  | 'terminal'
  | 'sunset'
  | 'harbor'
  | 'blush'

export const UI_THEMES: Array<{ id: UiTheme; label: string }> = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'illustrator', label: 'Illustrator' },
  { id: 'paper', label: 'Paper' },
  { id: 'nord', label: 'Nord' },
  { id: 'matcha', label: 'Matcha' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'harbor', label: 'Harbor' },
  { id: 'blush', label: 'Blush' },
]

const THEME_IDS = new Set(UI_THEMES.map((t) => t.id))
const STORAGE_KEY = 'penultimate-theme'
const LEGACY_STORAGE_KEY = 'anchor-mgmt-theme'

function isTheme(value: string | null): value is UiTheme {
  return value != null && THEME_IDS.has(value as UiTheme)
}

function readTheme(): UiTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (isTheme(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'coffee'
}

function applyTheme(theme: UiTheme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useUiTheme() {
  const [theme, setThemeState] = useState<UiTheme>(() => {
    const t = readTheme()
    applyTheme(t)
    return t
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next)
  }, [])

  return { theme, setTheme, themes: UI_THEMES }
}
