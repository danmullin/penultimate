import type { VecNode, VectorDocument } from '../types'
import { nextId } from './group'
import { normalizePathD } from './pathSvg'
import {
  ensurePaper,
  nodeToPaperPath,
  pathDataFromItem,
  pathfinderTargetIds,
} from './paperUtils'

type PathItem = NonNullable<ReturnType<typeof nodeToPaperPath>>

export type PathfinderOp =
  | 'unite'
  | 'subtract'
  | 'intersect'
  | 'exclude'
  | 'divide'
  | 'trim'

export { pathfinderTargetIds }

function applyBinary(
  a: PathItem,
  b: PathItem,
  op: 'unite' | 'subtract' | 'intersect' | 'exclude',
): PathItem | null {
  try {
    let out: PathItem | null = null
    switch (op) {
      case 'unite':
        out = a.unite(b) as PathItem
        break
      case 'subtract':
        out = a.subtract(b) as PathItem
        break
      case 'intersect':
        out = a.intersect(b) as PathItem
        break
      case 'exclude':
        out = a.exclude(b) as PathItem
        break
    }
    if (!out) return null
    const d = pathDataFromItem(out)
    if (!d) {
      out.remove()
      return null
    }
    return out
  } catch {
    return null
  }
}

function cloneStyle(node: VecNode): VecNode['style'] {
  return structuredClone(node.style)
}

function itemToNode(
  item: PathItem,
  styleSource: VecNode,
  name: string,
): VecNode | null {
  const raw = pathDataFromItem(item)
  const d = normalizePathD(raw)
  if (!d) return null
  return {
    id: nextId('path'),
    type: 'path',
    name,
    visible: true,
    locked: false,
    rotation: 0,
    style: cloneStyle(styleSource),
    d,
  }
}

function replaceSelection(
  doc: VectorDocument,
  removeIds: string[],
  newNodes: VecNode[],
): { nodes: Record<string, VecNode>; zOrder: string[]; resultIds: string[] } {
  const remove = new Set(removeIds)
  const nodes: Record<string, VecNode> = { ...doc.nodes }
  for (const id of remove) delete nodes[id]
  for (const id of Object.keys(nodes)) {
    const n = nodes[id]
    if (n.type === 'group') {
      nodes[id] = {
        ...n,
        children: n.children.filter((c) => !remove.has(c)),
      }
    }
  }
  for (const n of newNodes) nodes[n.id] = n

  const zOrder = doc.zOrder.filter((id) => !remove.has(id))
  const idxs = removeIds.map((id) => doc.zOrder.indexOf(id)).filter((i) => i >= 0)
  const insertAt = idxs.length ? Math.min(...idxs) : zOrder.length
  zOrder.splice(Math.max(0, insertAt), 0, ...newNodes.map((n) => n.id))
  return { nodes, zOrder, resultIds: newNodes.map((n) => n.id) }
}

function cleanup(items: Array<PathItem | null | undefined>) {
  for (const item of items) {
    try {
      item?.remove()
    } catch {
      /* already removed */
    }
  }
}

/**
 * Boolean Pathfinder on ≥2 selected shapes.
 * Classic ops → one result; divide/trim → multiple fragments.
 */
export function pathfinder(
  doc: VectorDocument,
  selectedIds: string[],
  op: PathfinderOp,
): { nodes: Record<string, VecNode>; zOrder: string[]; resultIds: string[] } | null {
  const ids = pathfinderTargetIds(doc, selectedIds)
  if (ids.length < 2) return null

  ensurePaper()
  const paths = ids
    .map((id) => nodeToPaperPath(doc.nodes[id]!))
    .filter(Boolean) as PathItem[]
  if (paths.length < 2) {
    cleanup(paths)
    return null
  }

  const first = doc.nodes[ids[0]]!

  try {
    if (op === 'divide') {
      let fragments: PathItem[] = [paths[0].clone() as PathItem]
      for (let i = 1; i < paths.length; i++) {
        const cutter = paths[i]
        const next: PathItem[] = []
        for (const frag of fragments) {
          try {
            const only = frag.subtract(cutter) as PathItem | null
            const both = frag.intersect(cutter) as PathItem | null
            if (only && pathDataFromItem(only).trim()) next.push(only)
            else only?.remove()
            if (both && pathDataFromItem(both).trim()) next.push(both)
            else both?.remove()
          } catch {
            /* skip bad fragment */
          }
          frag.remove()
        }
        try {
          let rest: PathItem | null = cutter.clone() as PathItem
          for (let j = 0; j < i; j++) {
            if (!rest) break
            const sub = rest.subtract(paths[j]) as PathItem | null
            rest.remove()
            rest = sub
          }
          if (rest && pathDataFromItem(rest).trim()) next.push(rest)
          else rest?.remove()
        } catch {
          /* skip */
        }
        fragments = next
      }

      const newNodes: VecNode[] = []
      for (let i = 0; i < fragments.length; i++) {
        const n = itemToNode(fragments[i], first, `Divide ${i + 1}`)
        if (n) newNodes.push(n)
        fragments[i].remove()
      }
      cleanup(paths)
      if (newNodes.length === 0) return null
      return replaceSelection(doc, ids, newNodes)
    }

    if (op === 'trim') {
      const newNodes: VecNode[] = []
      for (let i = 0; i < paths.length; i++) {
        let piece: PathItem | null = paths[i].clone() as PathItem
        for (let j = i + 1; j < paths.length; j++) {
          if (!piece) break
          try {
            const next = piece.subtract(paths[j]) as PathItem | null
            piece.remove()
            piece = next
          } catch {
            break
          }
        }
        if (piece) {
          const n = itemToNode(piece, doc.nodes[ids[i]]!, `Trim ${i + 1}`)
          if (n) newNodes.push(n)
          piece.remove()
        }
      }
      cleanup(paths)
      if (newNodes.length === 0) return null
      return replaceSelection(doc, ids, newNodes)
    }

    let result: PathItem | null = paths[0].clone() as PathItem
    for (let i = 1; i < paths.length; i++) {
      if (!result) break
      const next = applyBinary(result, paths[i], op)
      result.remove()
      result = next
    }
    if (!result) {
      cleanup(paths)
      return null
    }

    const node = itemToNode(result, first, `Boolean ${op}`)
    cleanup([...paths, result])
    if (!node) return null
    return replaceSelection(doc, ids, [node])
  } catch (err) {
    console.warn('Pathfinder failed', op, err)
    cleanup(paths)
    return null
  }
}
