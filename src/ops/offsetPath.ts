import paper from 'paper'
import { nextId } from './group'
import { normalizePathD } from './pathSvg'
import { collectPaperPaths, ensurePaper, nodeToPaperPath, pathDataFromItem } from './paperUtils'
import { defaultStyle, type VecNode, type VectorDocument } from '../types'
import { paintNone, paintSolid } from '../style/paint'

/** Offset a flattened polyline outward (positive) or inward (negative). */
function offsetPolyline(
  points: paper.Point[],
  distance: number,
  closed: boolean,
): paper.Point[] {
  if (points.length < 2) return points
  const n = points.length
  const out: paper.Point[] = []
  const count = closed ? n : n

  for (let i = 0; i < count; i++) {
    const prev = points[(i - 1 + n) % n]
    const curr = points[i]
    const next = points[(i + 1) % n]
    let dir1: paper.Point
    let dir2: paper.Point
    if (!closed && i === 0) {
      dir1 = next.subtract(curr).normalize()
      dir2 = dir1
    } else if (!closed && i === n - 1) {
      dir1 = curr.subtract(prev).normalize()
      dir2 = dir1
    } else {
      dir1 = curr.subtract(prev).normalize()
      dir2 = next.subtract(curr).normalize()
    }
    const n1 = new paper.Point(-dir1.y, dir1.x)
    const n2 = new paper.Point(-dir2.y, dir2.x)
    let normal = n1.add(n2)
    if (normal.length < 1e-6) normal = n1
    else normal = normal.normalize()
    out.push(curr.add(normal.multiply(distance)))
  }
  return out
}

function flattenToPoints(path: paper.Path, flatness = 1): paper.Point[] {
  const clone = path.clone() as paper.Path
  clone.flatten(flatness)
  const pts = clone.segments.map((s) => s.point.clone())
  clone.remove()
  return pts
}

function pointsToPath(points: paper.Point[], closed: boolean): paper.Path {
  const p = new paper.Path()
  for (const pt of points) p.add(pt)
  p.closed = closed
  return p
}

/**
 * Offset a path-like node by `distance` (px). Positive expands, negative insets.
 * Returns a new filled path node replacing the selection.
 */
export function offsetSelected(
  doc: VectorDocument,
  selectedIds: string[],
  distance: number,
): { nodes: Record<string, VecNode>; zOrder: string[]; resultId: string } | null {
  const id = selectedIds.find((sid) => {
    const n = doc.nodes[sid]
    return n && n.visible && !n.locked && (n.type === 'path' || n.type === 'rect' || n.type === 'ellipse')
  })
  if (!id) return null
  const node = doc.nodes[id]!

  ensurePaper()
  const item = nodeToPaperPath(node)
  if (!item) return null
  const path = collectPaperPaths(item)[0]
  if (!path) {
    item.remove()
    return null
  }

  const closed = path.closed || node.type === 'rect' || node.type === 'ellipse'
  const pts = flattenToPoints(path)
  const offsetPts = offsetPolyline(pts, distance, closed)
  const out = pointsToPath(offsetPts, closed)
  const d = normalizePathD(pathDataFromItem(out))
  item.remove()
  out.remove()
  if (!d) return null

  const resultId = nextId('path')
  const pathNode: VecNode = {
    id: resultId,
    type: 'path',
    name: `Offset ${distance >= 0 ? '+' : ''}${Math.round(distance)}`,
    visible: true,
    locked: false,
    rotation: 0,
    style: {
      ...defaultStyle(),
      ...node.style,
      fill: node.style.fill.type === 'none' ? paintSolid('#ffffff') : node.style.fill,
      stroke: paintNone(),
      strokeWidth: 0,
    },
    d,
  }

  return replaceOne(doc, id, pathNode, resultId)
}

/**
 * Convert stroke of selected path/shape into a filled outline path.
 */
export function outlineStrokeSelected(
  doc: VectorDocument,
  selectedIds: string[],
): { nodes: Record<string, VecNode>; zOrder: string[]; resultId: string } | null {
  const id = selectedIds.find((sid) => {
    const n = doc.nodes[sid]
    return (
      n &&
      n.visible &&
      !n.locked &&
      n.style.stroke.type !== 'none' &&
      n.style.strokeWidth > 0 &&
      (n.type === 'path' || n.type === 'line' || n.type === 'rect' || n.type === 'ellipse')
    )
  })
  if (!id) return null
  const node = doc.nodes[id]!
  const sw = node.style.strokeWidth

  ensurePaper()
  const item = nodeToPaperPath(node)
  if (!item) return null
  const path = collectPaperPaths(item)[0]
  if (!path) {
    item.remove()
    return null
  }

  const closed = path.closed || node.type === 'rect' || node.type === 'ellipse'
  const pts = flattenToPoints(path, 0.75)
  const half = sw / 2

  let d: string
  if (closed) {
    const outer = pointsToPath(offsetPolyline(pts, half, true), true)
    const inner = pointsToPath(offsetPolyline(pts, -half, true), true)
    const ring = outer.exclude(inner) ?? outer.subtract(inner)
    d = normalizePathD(pathDataFromItem(ring ?? outer))
    outer.remove()
    inner.remove()
    ring?.remove()
  } else {
    const left = offsetPolyline(pts, half, false)
    const right = offsetPolyline([...pts].reverse(), half, false)
    const ribbonPts = [...left, ...right]
    const ribbon = pointsToPath(ribbonPts, true)
    d = normalizePathD(pathDataFromItem(ribbon))
    ribbon.remove()
  }

  item.remove()
  if (!d) return null

  const strokePaint = node.style.stroke
  const resultId = nextId('path')
  const pathNode: VecNode = {
    id: resultId,
    type: 'path',
    name: 'Outlined stroke',
    visible: true,
    locked: false,
    rotation: 0,
    style: {
      ...defaultStyle(),
      fill: strokePaint.type === 'none' ? paintSolid('#000000') : strokePaint,
      stroke: paintNone(),
      strokeWidth: 0,
      opacity: node.style.opacity,
      blendMode: node.style.blendMode,
      shadow: node.style.shadow,
    },
    d,
  }

  return replaceOne(doc, id, pathNode, resultId)
}

function replaceOne(
  doc: VectorDocument,
  oldId: string,
  pathNode: VecNode,
  resultId: string,
): { nodes: Record<string, VecNode>; zOrder: string[]; resultId: string } {
  const nodes = { ...doc.nodes }
  delete nodes[oldId]
  nodes[resultId] = pathNode
  const zOrder = [...doc.zOrder]
  const idx = zOrder.indexOf(oldId)
  if (idx >= 0) zOrder.splice(idx, 1, resultId)
  else zOrder.push(resultId)
  return { nodes, zOrder, resultId }
}
