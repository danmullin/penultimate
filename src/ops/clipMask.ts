import type { GroupNode, VecNode, VectorDocument } from '../types'
import { defaultStyle } from '../types'
import { nodeBBox, parentOf, unionBoxes } from '../geometry'
import { nextId } from './group'

/**
 * Make a clipping mask: topmost selected object clips the rest.
 * Creates (or reuses) a group with `clipped: true`; first child = mask.
 */
export function makeClippingMask(
  doc: VectorDocument,
  ids: string[],
): { nodes: Record<string, VecNode>; zOrder: string[]; groupId: string } | null {
  const topLevel = ids.filter((id) => {
    const n = doc.nodes[id]
    return n && !parentOf(id, doc) && n.type !== 'image'
  })
  if (topLevel.length < 2) return null

  // Highest in zOrder is the mask (Illustrator: frontmost clips)
  const ordered = [...topLevel].sort(
    (a, b) => doc.zOrder.indexOf(a) - doc.zOrder.indexOf(b),
  )
  const maskId = ordered[ordered.length - 1]
  const contentIds = ordered.slice(0, -1)
  const all = [...contentIds, maskId]

  const boxes = all.map((id) => nodeBBox(doc.nodes[id], doc))
  const box = unionBoxes(boxes)
  const groupId = nextId('group')
  const group: GroupNode = {
    id: groupId,
    type: 'group',
    name: 'Clip Group',
    visible: true,
    locked: false,
    rotation: 0,
    style: defaultStyle(),
    children: [maskId, ...contentIds],
    x: box.x,
    y: box.y,
    clipped: true,
  }

  const nodes = { ...doc.nodes, [groupId]: group }
  let insertAt = 0
  const zOrder = doc.zOrder.filter((id, index) => {
    if (all.includes(id)) {
      insertAt = Math.max(insertAt, index)
      return false
    }
    return true
  })
  const removedBefore = doc.zOrder
    .slice(0, insertAt + 1)
    .filter((id) => all.includes(id)).length
  const at = Math.max(0, insertAt - removedBefore + 1)
  zOrder.splice(at, 0, groupId)

  return { nodes, zOrder, groupId }
}

export function releaseClippingMask(
  doc: VectorDocument,
  ids: string[],
): { nodes: Record<string, VecNode>; zOrder: string[]; revealed: string[] } | null {
  const groupIds = ids.filter((id) => {
    const n = doc.nodes[id]
    return n?.type === 'group' && n.clipped
  })
  if (groupIds.length === 0) return null

  const nodes = { ...doc.nodes }
  let zOrder = [...doc.zOrder]
  const revealed: string[] = []

  for (const gid of groupIds) {
    const group = nodes[gid]
    if (!group || group.type !== 'group') continue
    const idx = zOrder.indexOf(gid)
    if (idx >= 0) zOrder.splice(idx, 1, ...group.children)
    else zOrder.push(...group.children)
    revealed.push(...group.children)
    delete nodes[gid]
  }

  return { nodes, zOrder, revealed }
}
