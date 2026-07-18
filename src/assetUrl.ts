/** Public asset URL that respects Vite `base` (e.g. `/penultimate/` on GitHub Pages). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const clean = path.replace(/^\//, '')
  return `${base}${clean}`
}
