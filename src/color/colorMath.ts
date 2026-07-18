/** sRGB hex (#rrggbb) ↔ HSV helpers for the in-app color picker. */

export type HSV = { h: number; s: number; v: number }

export function normalizeHex(raw: string): string | null {
  const c = raw.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(c)) return c
  if (/^#[0-9a-f]{3}$/.test(c)) {
    const r = c[1]!
    const g = c[2]!
    const b = c[3]!
    return `#${r}${r}${g}${g}${b}${b}`
  }
  if (/^[0-9a-f]{6}$/.test(c)) return `#${c}`
  if (/^[0-9a-f]{3}$/.test(c)) {
    const r = c[0]!
    const g = c[1]!
    const b = c[2]!
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return null
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex)
  if (!n) return null
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`
}

export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let rp = 0
  let gp = 0
  let bp = 0
  if (h < 60) [rp, gp, bp] = [c, x, 0]
  else if (h < 120) [rp, gp, bp] = [x, c, 0]
  else if (h < 180) [rp, gp, bp] = [0, c, x]
  else if (h < 240) [rp, gp, bp] = [0, x, c]
  else if (h < 300) [rp, gp, bp] = [x, 0, c]
  else [rp, gp, bp] = [c, 0, x]
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  }
}

export function hexToHsv(hex: string): HSV {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 0, v: 0 }
  return rgbToHsv(rgb.r, rgb.g, rgb.b)
}

export function hsvToHex(hsv: HSV): string {
  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v)
  return rgbToHex(r, g, b)
}
