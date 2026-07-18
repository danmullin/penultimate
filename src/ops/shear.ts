import paper from 'paper'
import { nodeBBox } from '../geometry'
import { ensurePaper } from './paperUtils'
import type { VecNode, VectorDocument } from '../types'

/**
 * Shear selection horizontally (axis 'x') or vertically (axis 'y').
 * `amount` is the shear factor (dx/dy or dy/dx).
 */
export function shearNodes(
  doc: VectorDocument,
  ids: string[],
  axis: 'x' | 'y',
  amount: number,
): Record<string, VecNode> {
  const boxes = ids
    .map((id) => doc.nodes[id])
    .filter(Boolean)
    .map((n) => nodeBBox(n!, doc))
  if (boxes.length === 0) return doc.nodes

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of boxes) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  const nodes = { ...doc.nodes }
  for (const id of ids) {
    const n = nodes[id]
    if (!n || n.locked) continue
    nodes[id] = shearNode(n, axis, amount, cx, cy)
    if (n.type === 'group') {
      for (const cid of n.children) {
        const child = nodes[cid]
        if (child) nodes[cid] = shearNode(child, axis, amount, cx, cy)
      }
    }
  }
  return nodes
}

function shearPoint(
  x: number,
  y: number,
  axis: 'x' | 'y',
  amount: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  if (axis === 'x') return { x: x + amount * (y - cy), y }
  return { x, y: y + amount * (x - cx) }
}

function shearNode(
  node: VecNode,
  axis: 'x' | 'y',
  amount: number,
  cx: number,
  cy: number,
): VecNode {
  switch (node.type) {
    case 'rect':
    case 'image': {
      const corners = [
        shearPoint(node.x, node.y, axis, amount, cx, cy),
        shearPoint(node.x + node.width, node.y, axis, amount, cx, cy),
        shearPoint(node.x + node.width, node.y + node.height, axis, amount, cx, cy),
        shearPoint(node.x, node.y + node.height, axis, amount, cx, cy),
      ]
      const d = `M ${corners[0].x} ${corners[0].y} L ${corners[1].x} ${corners[1].y} L ${corners[2].x} ${corners[2].y} L ${corners[3].x} ${corners[3].y} Z`
      return {
        id: node.id,
        type: 'path',
        name: node.name,
        visible: node.visible,
        locked: node.locked,
        rotation: 0,
        style: node.style,
        d,
      }
    }
    case 'ellipse': {
      const steps = 32
      const pts: string[] = []
      for (let i = 0; i < steps; i++) {
        const t = (i / steps) * Math.PI * 2
        const px = node.cx + node.rx * Math.cos(t)
        const py = node.cy + node.ry * Math.sin(t)
        const s = shearPoint(px, py, axis, amount, cx, cy)
        pts.push(`${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`)
      }
      return {
        id: node.id,
        type: 'path',
        name: node.name,
        visible: node.visible,
        locked: node.locked,
        rotation: 0,
        style: node.style,
        d: `${pts.join(' ')} Z`,
      }
    }
    case 'line': {
      const p1 = shearPoint(node.x1, node.y1, axis, amount, cx, cy)
      const p2 = shearPoint(node.x2, node.y2, axis, amount, cx, cy)
      return { ...node, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
    }
    case 'text': {
      const p = shearPoint(node.x, node.y, axis, amount, cx, cy)
      return { ...node, x: p.x, y: p.y }
    }
    case 'path': {
      ensurePaper()
      try {
        const item = new paper.Path(node.d)
        for (const seg of item.segments) {
          const s = shearPoint(seg.point.x, seg.point.y, axis, amount, cx, cy)
          const hin = seg.handleIn
          const hout = seg.handleOut
          seg.point = new paper.Point(s.x, s.y)
          if (axis === 'x') {
            seg.handleIn = new paper.Point(hin.x + amount * hin.y, hin.y)
            seg.handleOut = new paper.Point(hout.x + amount * hout.y, hout.y)
          } else {
            seg.handleIn = new paper.Point(hin.x, hin.y + amount * hin.x)
            seg.handleOut = new paper.Point(hout.x, hout.y + amount * hout.x)
          }
        }
        const d = item.pathData
        item.remove()
        return { ...node, d, rotation: 0 }
      } catch {
        return node
      }
    }
    case 'group':
      return node
  }
}
