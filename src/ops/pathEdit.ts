/** Path anchor editing via Paper.js — handles relative/absolute/S/C from boolean ops. */

import paper from 'paper'
import { parsePathItem } from './pathSvg'

export type PathAnchor = {
  index: number
  x: number
  y: number
  /** Outgoing handle absolute position (segment.handleOut). */
  cx?: number
  cy?: number
  /** Incoming handle absolute position (segment.handleIn). */
  ix?: number
  iy?: number
}

function ensurePaper(): void {
  if (!paper.project) {
    paper.setup(new paper.Size(1, 1))
  }
}

function collectPaths(item: paper.PathItem): paper.Path[] {
  if (item instanceof paper.Path) return [item]
  if (item instanceof paper.CompoundPath) {
    return item.children.filter((c): c is paper.Path => c instanceof paper.Path)
  }
  return []
}

/**
 * Extract editable anchors from any SVG path `d` (Paper.js boolean output included).
 */
export function parseAnchors(d: string): PathAnchor[] {
  ensurePaper()
  const item = parsePathItem(d)
  if (!item) return []
  const anchors: PathAnchor[] = []
  let index = 0
  for (const path of collectPaths(item)) {
    for (const seg of path.segments) {
      const x = seg.point.x
      const y = seg.point.y
      const out = seg.handleOut
      const inn = seg.handleIn
      const a: PathAnchor = { index: index++, x, y }
      if (out.x !== 0 || out.y !== 0) {
        a.cx = x + out.x
        a.cy = y + out.y
      }
      if (inn.x !== 0 || inn.y !== 0) {
        a.ix = x + inn.x
        a.iy = y + inn.y
      }
      anchors.push(a)
    }
  }
  item.remove()
  return anchors
}

function applyAnchorsToItem(item: paper.PathItem, anchors: PathAnchor[]): void {
  const paths = collectPaths(item)
  let i = 0
  for (const path of paths) {
    for (const seg of path.segments) {
      const a = anchors[i++]
      if (!a) return
      seg.point = new paper.Point(a.x, a.y)
      if (a.cx !== undefined && a.cy !== undefined) {
        seg.handleOut = new paper.Point(a.cx - a.x, a.cy - a.y)
      } else {
        seg.handleOut = new paper.Point(0, 0)
      }
      if (a.ix !== undefined && a.iy !== undefined) {
        seg.handleIn = new paper.Point(a.ix - a.x, a.iy - a.y)
      } else {
        seg.handleIn = new paper.Point(0, 0)
      }
    }
  }
}

/** Rebuild path `d` from edited anchors, preserving topology via Paper. */
export function anchorsToPath(anchors: PathAnchor[], closed = false, templateD?: string): string {
  ensurePaper()
  if (anchors.length === 0) return ''

  if (templateD) {
    const item = parsePathItem(templateD)
    if (item) {
      const expected = collectPaths(item).reduce((n, p) => n + p.segments.length, 0)
      if (expected === anchors.length) {
        applyAnchorsToItem(item, anchors)
        for (const path of collectPaths(item)) {
          if (closed) path.closed = true
        }
        const out = item.pathData
        item.remove()
        return out
      }
      item.remove()
    }
  }

  // Fallback: simple polyline / quadratic rebuild
  const [first, ...rest] = anchors
  let d = `M ${round(first.x)} ${round(first.y)}`
  for (const a of rest) {
    if (a.cx !== undefined && a.cy !== undefined) {
      const prev = anchors[a.index - 1] ?? first
      const c1x = prev.cx ?? prev.x
      const c1y = prev.cy ?? prev.y
      // Prefer cubic if we have outgoing from prev + incoming to current
      if (a.ix !== undefined && a.iy !== undefined) {
        d += ` C ${round(c1x)} ${round(c1y)} ${round(a.ix)} ${round(a.iy)} ${round(a.x)} ${round(a.y)}`
      } else {
        d += ` Q ${round(a.cx)} ${round(a.cy)} ${round(a.x)} ${round(a.y)}`
      }
    } else if (a.ix !== undefined && a.iy !== undefined) {
      const prev = anchors[a.index - 1] ?? first
      d += ` C ${round(prev.x)} ${round(prev.y)} ${round(a.ix)} ${round(a.iy)} ${round(a.x)} ${round(a.y)}`
    } else {
      d += ` L ${round(a.x)} ${round(a.y)}`
    }
  }
  if (closed) d += ' Z'
  return d
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function moveAnchor(d: string, anchorIndex: number, x: number, y: number): string {
  const anchors = parseAnchors(d)
  const a = anchors.find((p) => p.index === anchorIndex)
  if (!a) return d
  const dx = x - a.x
  const dy = y - a.y
  a.x = x
  a.y = y
  if (a.cx !== undefined) a.cx += dx
  if (a.cy !== undefined) a.cy += dy
  if (a.ix !== undefined) a.ix += dx
  if (a.iy !== undefined) a.iy += dy
  const closed = isClosedPath(d)
  return anchorsToPath(anchors, closed, d)
}

export function deleteAnchor(d: string, anchorIndex: number): string {
  ensurePaper()
  const item = parsePathItem(d)
  if (!item) return d
  const paths = collectPaths(item)
  let remaining = anchorIndex
  let target: paper.Segment | null = null
  let targetPath: paper.Path | null = null
  for (const path of paths) {
    if (remaining < path.segments.length) {
      target = path.segments[remaining]
      targetPath = path
      break
    }
    remaining -= path.segments.length
  }
  if (!target || !targetPath || targetPath.segments.length <= 2) {
    item.remove()
    return d
  }
  target.remove()
  const out = item.pathData
  item.remove()
  return out
}

export function addAnchorAfter(d: string, afterIndex: number, x: number, y: number): string {
  ensurePaper()
  const item = parsePathItem(d)
  if (!item) return d
  const paths = collectPaths(item)
  let remaining = afterIndex
  for (const path of paths) {
    if (remaining < path.segments.length) {
      path.insert(remaining + 1, new paper.Point(x, y))
      const out = item.pathData
      item.remove()
      return out
    }
    remaining -= path.segments.length
  }
  item.remove()
  return d
}

export function convertAnchor(d: string, anchorIndex: number): string {
  ensurePaper()
  const item = parsePathItem(d)
  if (!item) return d
  const paths = collectPaths(item)
  let remaining = anchorIndex
  for (const path of paths) {
    if (remaining < path.segments.length) {
      const seg = path.segments[remaining]
      const hasHandles =
        seg.handleIn.length > 0.01 || seg.handleOut.length > 0.01
      if (hasHandles) {
        seg.handleIn = new paper.Point(0, 0)
        seg.handleOut = new paper.Point(0, 0)
      } else {
        // Make smooth: small aligned handles
        const prev = seg.previous ?? seg
        const next = seg.next ?? seg
        const dx = (next.point.x - prev.point.x) / 6
        const dy = (next.point.y - prev.point.y) / 6
        seg.handleIn = new paper.Point(-dx, -dy)
        seg.handleOut = new paper.Point(dx, dy)
      }
      const out = item.pathData
      item.remove()
      return out
    }
    remaining -= path.segments.length
  }
  item.remove()
  return d
}

function isClosedPath(d: string): boolean {
  ensurePaper()
  const item = parsePathItem(d)
  if (!item) return /\s*[Zz]\s*$/.test(d.trim())
  const closed = collectPaths(item).some((p) => p.closed)
  item.remove()
  return closed
}
