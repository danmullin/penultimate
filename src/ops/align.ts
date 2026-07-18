import {
  nodeBBox,
  selectionBBox,
  translateNode,
  unionBoxes,
} from '../geometry'
import type { BBox, VecNode, VectorDocument } from '../types'

export type AlignMode =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'

export type DistributeMode = 'horizontal' | 'vertical'

function moveNodeTo(node: VecNode, targetX: number, targetY: number, doc: VectorDocument): VecNode {
  const box = nodeBBox(node, doc)
  return translateNode(node, targetX - box.x, targetY - box.y)
}

export function alignNodes(
  doc: VectorDocument,
  ids: string[],
  mode: AlignMode,
  relativeToArtboard: boolean,
): Record<string, VecNode> {
  const nodes = { ...doc.nodes }
  const boxes = ids
    .map((id) => {
      const n = nodes[id]
      return n ? { id, box: nodeBBox(n, doc) } : null
    })
    .filter(Boolean) as { id: string; box: BBox }[]

  if (boxes.length === 0) return nodes

  const ref: BBox = relativeToArtboard
    ? { x: 0, y: 0, width: doc.artboard.width, height: doc.artboard.height }
    : unionBoxes(boxes.map((b) => b.box))

  for (const item of boxes) {
    const node = nodes[item.id]
    if (!node || node.locked) continue
    let tx = item.box.x
    let ty = item.box.y
    switch (mode) {
      case 'left':
        tx = ref.x
        break
      case 'center':
        tx = ref.x + ref.width / 2 - item.box.width / 2
        break
      case 'right':
        tx = ref.x + ref.width - item.box.width
        break
      case 'top':
        ty = ref.y
        break
      case 'middle':
        ty = ref.y + ref.height / 2 - item.box.height / 2
        break
      case 'bottom':
        ty = ref.y + ref.height - item.box.height
        break
    }
    nodes[item.id] = moveNodeTo(node, tx, ty, { ...doc, nodes })
  }
  return nodes
}

export function distributeNodes(
  doc: VectorDocument,
  ids: string[],
  mode: DistributeMode,
): Record<string, VecNode> {
  const nodes = { ...doc.nodes }
  if (ids.length < 3) return nodes

  const items = ids
    .map((id) => {
      const n = nodes[id]
      return n ? { id, box: nodeBBox(n, doc), node: n } : null
    })
    .filter(Boolean) as { id: string; box: BBox; node: VecNode }[]

  if (items.length < 3) return nodes

  if (mode === 'horizontal') {
    items.sort((a, b) => a.box.x - b.box.x)
    const first = items[0].box
    const last = items[items.length - 1].box
    const totalWidth = items.reduce((s, i) => s + i.box.width, 0)
    const span = last.x + last.width - first.x
    const gap = (span - totalWidth) / (items.length - 1)
    let cursor = first.x
    for (const item of items) {
      if (!item.node.locked) {
        nodes[item.id] = moveNodeTo(item.node, cursor, item.box.y, { ...doc, nodes })
      }
      cursor += item.box.width + gap
    }
  } else {
    items.sort((a, b) => a.box.y - b.box.y)
    const first = items[0].box
    const last = items[items.length - 1].box
    const totalHeight = items.reduce((s, i) => s + i.box.height, 0)
    const span = last.y + last.height - first.y
    const gap = (span - totalHeight) / (items.length - 1)
    let cursor = first.y
    for (const item of items) {
      if (!item.node.locked) {
        nodes[item.id] = moveNodeTo(item.node, item.box.x, cursor, { ...doc, nodes })
      }
      cursor += item.box.height + gap
    }
  }

  return nodes
}

export function canAlign(ids: string[]): boolean {
  return ids.length >= 1
}

export function canDistribute(ids: string[]): boolean {
  return ids.length >= 3
}

export function artboardSelectionHint(ids: string[], doc: VectorDocument): BBox | null {
  return selectionBBox(ids, doc)
}
