import paper from 'paper'
import { nextId } from './group'
import { normalizePathD } from './pathSvg'
import { collectPaperPaths, ensurePaper, nodeToPaperPath, pathDataFromItem } from './paperUtils'
import { defaultStyle, type VecNode, type VectorDocument } from '../types'

const JOIN_THRESHOLD = 8

/**
 * Split a path node at the nearest point to (x,y).
 * Closed paths open at the cut; open paths become two open paths.
 */
export function scissorsSplit(
  doc: VectorDocument,
  pathId: string,
  x: number,
  y: number,
): { nodes: Record<string, VecNode>; zOrder: string[]; resultIds: string[] } | null {
  const node = doc.nodes[pathId]
  if (!node || node.type !== 'path' || node.locked || !node.visible) return null

  ensurePaper()
  const item = nodeToPaperPath(node)
  if (!item) return null

  const paths = collectPaperPaths(item)
  if (paths.length === 0) {
    item.remove()
    return null
  }

  // Prefer the path whose nearest location is closest to the click.
  let bestPath: paper.Path | null = null
  let bestLoc: paper.CurveLocation | null = null
  let bestDist = Infinity
  const click = new paper.Point(x, y)
  for (const p of paths) {
    const loc = p.getNearestLocation(click)
    if (!loc) continue
    const dist = loc.point.getDistance(click)
    if (dist < bestDist) {
      bestDist = dist
      bestPath = p
      bestLoc = loc
    }
  }

  if (!bestPath || !bestLoc || bestDist > 24) {
    item.remove()
    return null
  }

  const wasClosed = bestPath.closed
  const splitResult = bestPath.splitAt(bestLoc)
  // paper.Path#splitAt returns the new path after the split (second half) for open,
  // or null / same path behavior for closed → becomes open.
  const parts: paper.Path[] = []
  if (wasClosed) {
    // Closed → one open path spanning full loop from cut.
    parts.push(bestPath)
  } else if (splitResult instanceof paper.Path) {
    parts.push(bestPath, splitResult)
  } else {
    parts.push(bestPath)
  }

  const ds = parts
    .map((p) => normalizePathD(pathDataFromItem(p)))
    .filter((d) => d && d.trim())

  item.remove()
  for (const p of parts) {
    try {
      p.remove()
    } catch {
      /* already removed with compound */
    }
  }

  if (ds.length === 0) return null

  const nodes = { ...doc.nodes }
  delete nodes[pathId]
  const resultIds: string[] = []
  const newNodes: VecNode[] = []

  for (let i = 0; i < ds.length; i++) {
    const id = nextId('path')
    resultIds.push(id)
    const n: VecNode = {
      id,
      type: 'path',
      name: ds.length > 1 ? `${node.name} ${i + 1}` : node.name,
      visible: true,
      locked: false,
      rotation: 0,
      style: { ...defaultStyle(), ...node.style },
      d: ds[i],
    }
    nodes[id] = n
    newNodes.push(n)
  }

  const zOrder = [...doc.zOrder]
  const idx = zOrder.indexOf(pathId)
  if (idx >= 0) {
    zOrder.splice(idx, 1, ...resultIds)
  } else {
    zOrder.push(...resultIds)
  }

  return { nodes, zOrder, resultIds }
}

/**
 * Join two selected open paths when endpoints are near each other.
 */
export function joinSelectedPaths(
  doc: VectorDocument,
  selectedIds: string[],
): { nodes: Record<string, VecNode>; zOrder: string[]; resultId: string } | null {
  const ids = selectedIds.filter((id) => {
    const n = doc.nodes[id]
    return n && n.type === 'path' && n.visible && !n.locked
  })
  if (ids.length < 2) return null

  ensurePaper()
  const aNode = doc.nodes[ids[0]]!
  const bNode = doc.nodes[ids[1]]!
  if (aNode.type !== 'path' || bNode.type !== 'path') return null

  const a = nodeToPaperPath(aNode)
  const b = nodeToPaperPath(bNode)
  if (!a || !b) {
    a?.remove()
    b?.remove()
    return null
  }

  const ap = collectPaperPaths(a)[0]
  const bp = collectPaperPaths(b)[0]
  if (!ap || !bp || ap.closed || bp.closed) {
    a.remove()
    b.remove()
    return null
  }

  const aFirst = ap.firstSegment.point
  const aLast = ap.lastSegment.point
  const bFirst = bp.firstSegment.point
  const bLast = bp.lastSegment.point

  type Pair = { how: 'a-end-b-start' | 'a-end-b-end' | 'a-start-b-start' | 'a-start-b-end'; dist: number }
  const candidates: Pair[] = [
    { how: 'a-end-b-start', dist: aLast.getDistance(bFirst) },
    { how: 'a-end-b-end', dist: aLast.getDistance(bLast) },
    { how: 'a-start-b-start', dist: aFirst.getDistance(bFirst) },
    { how: 'a-start-b-end', dist: aFirst.getDistance(bLast) },
  ]
  candidates.sort((x, y) => x.dist - y.dist)
  const best = candidates[0]
  if (!best || best.dist > JOIN_THRESHOLD) {
    a.remove()
    b.remove()
    return null
  }

  const joined = ap.clone() as paper.Path
  const other = bp.clone() as paper.Path

  if (best.how === 'a-end-b-end' || best.how === 'a-start-b-start') {
    other.reverse()
  }
  if (best.how === 'a-start-b-start' || best.how === 'a-start-b-end') {
    joined.reverse()
  }

  // Snap join point
  if (joined.lastSegment && other.firstSegment) {
    other.firstSegment.point = joined.lastSegment.point.clone()
  }
  joined.join(other)

  const d = normalizePathD(pathDataFromItem(joined))
  a.remove()
  b.remove()
  joined.remove()
  other.remove()
  if (!d) return null

  const resultId = nextId('path')
  const pathNode: VecNode = {
    id: resultId,
    type: 'path',
    name: 'Joined path',
    visible: true,
    locked: false,
    rotation: 0,
    style: { ...defaultStyle(), ...aNode.style },
    d,
  }

  const remove = new Set(ids.slice(0, 2))
  const nodes = { ...doc.nodes }
  for (const id of remove) delete nodes[id]
  nodes[resultId] = pathNode

  const zOrder = doc.zOrder.filter((id) => !remove.has(id))
  const insertAt = Math.min(
    ...[...remove].map((id) => doc.zOrder.indexOf(id)).filter((i) => i >= 0),
    zOrder.length,
  )
  zOrder.splice(Math.max(0, insertAt), 0, resultId)

  return { nodes, zOrder, resultId }
}
