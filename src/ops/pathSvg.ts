import type { BBox } from '../types'
import { parsePathItem } from './paperUtils'
import paper from 'paper'

export { parsePathItem } from './paperUtils'

export function pathBounds(d: string): BBox | null {
  const item = parsePathItem(d)
  if (!item) return null
  const b = item.bounds
  const box: BBox = {
    x: b.x,
    y: b.y,
    width: Math.max(1, b.width),
    height: Math.max(1, b.height),
  }
  item.remove()
  return box
}

/**
 * Translate an SVG path. Uses Paper so relative cmds / arcs / compounds stay intact.
 * (Naive number-pair rewriting breaks Paper.js pathfinder output.)
 */
export function translatePathD(d: string, dx: number, dy: number): string {
  if (!dx && !dy) return d
  const item = parsePathItem(d)
  if (!item) return d
  item.translate(new paper.Point(dx, dy))
  const out = item.pathData
  item.remove()
  return out
}

/** Scale path from oldBox → newBox via Paper. */
export function scalePathD(
  d: string,
  oldBox: BBox,
  sx: number,
  sy: number,
  newBox: BBox,
): string {
  const item = parsePathItem(d)
  if (!item) return d
  item.translate(new paper.Point(-oldBox.x, -oldBox.y))
  item.scale(sx, sy, new paper.Point(0, 0))
  item.translate(new paper.Point(newBox.x, newBox.y))
  const out = item.pathData
  item.remove()
  return out
}

/** Re-parse and re-export path data so boolean results are stable for later edits. */
export function normalizePathD(d: string): string {
  const item = parsePathItem(d)
  if (!item) return d
  item.applyMatrix = true
  const out = item.pathData
  item.remove()
  return out
}
