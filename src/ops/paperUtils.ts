import paper from 'paper'
import { nodeBBox } from '../geometry'
import type { VecNode, VectorDocument } from '../types'

let paperReady = false

export function ensurePaper(): typeof paper {
  if (!paperReady || !paper.project) {
    // One shared project for all boolean / path ops.
    paper.setup(new paper.Size(1, 1))
    paperReady = true
  }
  return paper
}

/** Parse SVG path `d` into a Paper item (compound-safe). */
export function parsePathItem(d: string): paper.PathItem | null {
  if (!d.trim()) return null
  ensurePaper()
  try {
    const compound = new paper.CompoundPath(d)
    if (!compound.isEmpty()) return compound
    compound.remove()
  } catch {
    /* fall through */
  }
  try {
    return new paper.Path(d)
  } catch {
    return null
  }
}

/** Minimal doc stub for bbox when rotation pivot is needed. */
function stubDoc(node: VecNode): VectorDocument {
  return {
    version: 1,
    name: '',
    artboard: { width: 1, height: 1, background: null },
    artboards: [{ id: 'a', name: 'A', x: 0, y: 0, width: 1, height: 1, background: null }],
    activeArtboardId: 'a',
    settings: {
      gridSize: 1,
      showGrid: false,
      snapToGrid: false,
      snapToNeighbors: false,
      snapThreshold: 1,
    },
    nodes: { [node.id]: node },
    zOrder: [node.id],
    swatches: [],
    manualGuides: [],
  }
}

/** Prepare a closed, filled path so Paper boolean ops succeed. */
export function prepareBooleanItem(
  item: paper.Path | paper.CompoundPath,
): paper.Path | paper.CompoundPath {
  const fill = new paper.Color(0, 0, 0)
  if (item instanceof paper.Path) {
    if (!item.closed) item.closePath()
    item.fillColor = fill
    item.strokeColor = null
  } else {
    for (const child of item.children) {
      if (child instanceof paper.Path) {
        if (!child.closed) child.closePath()
        child.fillColor = fill
        child.strokeColor = null
      }
    }
    item.fillColor = fill
  }
  return item
}

export function nodeToPaperPath(node: VecNode): paper.Path | paper.CompoundPath | null {
  ensurePaper()
  let item: paper.Item | null = null
  switch (node.type) {
    case 'rect': {
      item = new paper.Path.Rectangle(
        new paper.Rectangle(node.x, node.y, node.width, node.height),
        node.rx ? new paper.Size(node.rx, node.rx) : undefined,
      )
      break
    }
    case 'ellipse':
      item = new paper.Path.Ellipse(
        new paper.Rectangle(node.cx - node.rx, node.cy - node.ry, node.rx * 2, node.ry * 2),
      )
      break
    case 'path': {
      item = parsePathItem(node.d)
      break
    }
    case 'line': {
      const dx = node.x2 - node.x1
      const dy = node.y2 - node.y1
      const len = Math.hypot(dx, dy) || 1
      const nx = -dy / len
      const ny = dx / len
      const hw = Math.max(0.5, (node.style.strokeWidth || 1) / 2)
      const path = new paper.Path([
        new paper.Point(node.x1 + nx * hw, node.y1 + ny * hw),
        new paper.Point(node.x2 + nx * hw, node.y2 + ny * hw),
        new paper.Point(node.x2 - nx * hw, node.y2 - ny * hw),
        new paper.Point(node.x1 - nx * hw, node.y1 - ny * hw),
      ])
      path.closed = true
      item = path
      break
    }
    default:
      return null
  }
  if (!item) return null
  if (node.rotation) {
    const box = nodeBBox(node, stubDoc(node))
    item.rotate(node.rotation, new paper.Point(box.x + box.width / 2, box.y + box.height / 2))
  }
  return prepareBooleanItem(item as paper.Path | paper.CompoundPath)
}

export function pathDataFromItem(item: paper.PathItem): string {
  return item.pathData?.trim() ?? ''
}

export function collectPaperPaths(item: paper.PathItem): paper.Path[] {
  if (item instanceof paper.Path) return [item]
  if (item instanceof paper.CompoundPath) {
    return item.children.filter((c): c is paper.Path => c instanceof paper.Path)
  }
  return []
}

/** Ids eligible for Pathfinder (visible, unlocked shape geometry). */
export function pathfinderTargetIds(doc: VectorDocument, selectedIds: string[]): string[] {
  const eligible = selectedIds.filter((id) => {
    const n = doc.nodes[id]
    return (
      !!n &&
      n.visible &&
      !n.locked &&
      (n.type === 'rect' ||
        n.type === 'ellipse' ||
        n.type === 'path' ||
        n.type === 'line')
    )
  })
  return eligible.sort((a, b) => {
    const ia = doc.zOrder.indexOf(a)
    const ib = doc.zOrder.indexOf(b)
    const sa = ia < 0 ? Number.MAX_SAFE_INTEGER : ia
    const sb = ib < 0 ? Number.MAX_SAFE_INTEGER : ib
    return sa - sb
  })
}
