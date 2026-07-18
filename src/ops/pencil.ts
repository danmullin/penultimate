/** Ramer–Douglas–Peucker path simplification for freehand pencil. */

export type Pt = { x: number; y: number }

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function simplifyPoints(points: Pt[], epsilon = 1.5): Pt[] {
  if (points.length < 3) return points.slice()

  let maxDist = 0
  let maxIdx = 0
  const first = points[0]
  const last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = distToSegment(points[i], first, last)
    if (d > maxDist) {
      maxDist = d
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPoints(points.slice(0, maxIdx + 1), epsilon)
    const right = simplifyPoints(points.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [first, last]
}

export function pointsToPolylineD(points: Pt[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  let d = `M ${round(first.x)} ${round(first.y)}`
  for (const p of rest) {
    d += ` L ${round(p.x)} ${round(p.y)}`
  }
  return d
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
