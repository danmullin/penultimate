import { nodeBBox, parentOf, unionBoxes } from '../geometry'
import { defaultStyle, type GroupNode, type VecNode, type VectorDocument } from '../types'

let idCounter = 0
export function nextId(prefix = 'node'): string {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export function groupSelected(
  doc: VectorDocument,
  ids: string[],
): { nodes: Record<string, VecNode>; zOrder: string[]; groupId: string } | null {
  const topLevel = ids.filter((id) => {
    const n = doc.nodes[id]
    return n && !parentOf(id, doc)
  })
  if (topLevel.length < 2) return null

  const boxes = topLevel.map((id) => nodeBBox(doc.nodes[id], doc))
  const box = unionBoxes(boxes)
  const groupId = nextId('group')
  const group: GroupNode = {
    id: groupId,
    type: 'group',
    name: 'Group',
    visible: true,
    locked: false,
    rotation: 0,
    style: defaultStyle(),
    children: [...topLevel],
    x: box.x,
    y: box.y,
  }

  const nodes = { ...doc.nodes, [groupId]: group }
  // Remove children from top-level zOrder, insert group at highest child index
  let insertAt = 0
  const zOrder = doc.zOrder.filter((id, index) => {
    if (topLevel.includes(id)) {
      insertAt = Math.max(insertAt, index)
      return false
    }
    return true
  })
  // Adjust insert index after removals
  const removedBefore = doc.zOrder
    .slice(0, insertAt + 1)
    .filter((id) => topLevel.includes(id)).length
  const at = Math.max(0, insertAt - removedBefore + 1)
  zOrder.splice(at, 0, groupId)

  return { nodes, zOrder, groupId }
}

export function ungroupSelected(
  doc: VectorDocument,
  ids: string[],
): { nodes: Record<string, VecNode>; zOrder: string[]; revealed: string[] } | null {
  const groupIds = ids.filter((id) => doc.nodes[id]?.type === 'group')
  if (groupIds.length === 0) return null

  const nodes = { ...doc.nodes }
  let zOrder = [...doc.zOrder]
  const revealed: string[] = []

  for (const gid of groupIds) {
    const group = nodes[gid]
    if (!group || group.type !== 'group') continue
    const idx = zOrder.indexOf(gid)
    if (idx >= 0) {
      zOrder.splice(idx, 1, ...group.children)
    } else {
      zOrder.push(...group.children)
    }
    revealed.push(...group.children)
    delete nodes[gid]
  }

  return { nodes, zOrder, revealed }
}
