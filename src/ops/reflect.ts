import { pathBounds, scalePathD } from './pathSvg'
import type { BBox, VecNode, VectorDocument } from '../types'

export type ReflectAxis = 'horizontal' | 'vertical'

/** Mirror selected nodes across the selection center (true geometric flip). */
export function reflectNodes(
  doc: VectorDocument,
  ids: string[],
  axis: ReflectAxis,
): Record<string, VecNode> {
  const nodes = { ...doc.nodes }
  const box = selectionCenterBox(ids, doc)
  if (!box) return nodes

  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  for (const id of ids) {
    const n = nodes[id]
    if (!n || n.locked) continue
    if (n.type === 'group') {
      for (const childId of n.children) {
        const child = nodes[childId]
        if (child) nodes[childId] = reflectNode(child, cx, cy, axis)
      }
      nodes[id] = reflectNode(n, cx, cy, axis)
    } else {
      nodes[id] = reflectNode(n, cx, cy, axis)
    }
  }
  return nodes
}

function selectionCenterBox(ids: string[], doc: VectorDocument): BBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let any = false
  for (const id of ids) {
    const n = doc.nodes[id]
    if (!n || !n.visible) continue
    const b = nodeBounds(n)
    any = true
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  if (!any) return null
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
}

function nodeBounds(node: VecNode): BBox {
  switch (node.type) {
    case 'rect':
    case 'image':
      return { x: node.x, y: node.y, width: Math.max(1, node.width), height: Math.max(1, node.height) }
    case 'ellipse':
      return { x: node.cx - node.rx, y: node.cy - node.ry, width: node.rx * 2, height: node.ry * 2 }
    case 'line': {
      const x = Math.min(node.x1, node.x2)
      const y = Math.min(node.y1, node.y2)
      return { x, y, width: Math.max(1, Math.abs(node.x2 - node.x1)), height: Math.max(1, Math.abs(node.y2 - node.y1)) }
    }
    case 'text': {
      const w = Math.max(20, node.text.length * node.fontSize * 0.55)
      return { x: node.x, y: node.y - node.fontSize, width: w, height: node.fontSize * 1.2 }
    }
    case 'path':
      return pathBounds(node.d) ?? { x: 0, y: 0, width: 1, height: 1 }
    case 'group':
      return { x: node.x, y: node.y, width: 1, height: 1 }
  }
}

function reflectNode(node: VecNode, cx: number, cy: number, axis: ReflectAxis): VecNode {
  const flipX = (x: number) => Math.round((2 * cx - x) * 100) / 100
  const flipY = (y: number) => Math.round((2 * cy - y) * 100) / 100

  switch (node.type) {
    case 'rect':
    case 'image':
      if (axis === 'horizontal') return { ...node, x: flipX(node.x + node.width) }
      return { ...node, y: flipY(node.y + node.height) }
    case 'ellipse':
      if (axis === 'horizontal') return { ...node, cx: flipX(node.cx) }
      return { ...node, cy: flipY(node.cy) }
    case 'line':
      if (axis === 'horizontal') return { ...node, x1: flipX(node.x1), x2: flipX(node.x2) }
      return { ...node, y1: flipY(node.y1), y2: flipY(node.y2) }
    case 'text':
      if (axis === 'horizontal') return { ...node, x: flipX(node.x) }
      return { ...node, y: flipY(node.y) }
    case 'path': {
      const oldBox = pathBounds(node.d) ?? { x: 0, y: 0, width: 1, height: 1 }
      if (axis === 'horizontal') {
        return {
          ...node,
          d: scalePathD(node.d, oldBox, -1, 1, {
            x: flipX(oldBox.x + oldBox.width),
            y: oldBox.y,
            width: oldBox.width,
            height: oldBox.height,
          }),
        }
      }
      return {
        ...node,
        d: scalePathD(node.d, oldBox, 1, -1, {
          x: oldBox.x,
          y: flipY(oldBox.y + oldBox.height),
          width: oldBox.width,
          height: oldBox.height,
        }),
      }
    }
    case 'group':
      if (axis === 'horizontal') return { ...node, x: flipX(node.x) }
      return { ...node, y: flipY(node.y) }
  }
}
