import type { BBox, DocSettings, SnapGuide } from '../types'

export type SnapResult = {
  x: number
  y: number
  guides: SnapGuide[]
}

function snapValue(
  value: number,
  targets: number[],
  threshold: number,
): { value: number; snapped: boolean; target?: number } {
  let best: number | undefined
  let bestDist = threshold + 1
  for (const t of targets) {
    const dist = Math.abs(value - t)
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist
      best = t
    }
  }
  if (best === undefined) return { value, snapped: false }
  return { value: best, snapped: true, target: best }
}

export function snapBBox(
  box: BBox,
  others: BBox[],
  artboardW: number,
  artboardH: number,
  settings: DocSettings,
  manualGuides: SnapGuide[] = [],
): SnapResult {
  let x = box.x
  let y = box.y
  const guides: SnapGuide[] = []

  if (settings.snapToNeighbors) {
    const xs = [0, artboardW / 2, artboardW]
    const ys = [0, artboardH / 2, artboardH]
    for (const r of others) {
      xs.push(r.x, r.x + r.width / 2, r.x + r.width)
      ys.push(r.y, r.y + r.height / 2, r.y + r.height)
    }
    for (const g of manualGuides) {
      if (g.orientation === 'vertical') xs.push(g.position)
      else ys.push(g.position)
    }
    const threshold = settings.snapThreshold

    const left = snapValue(x, xs, threshold)
    const centerX = snapValue(x + box.width / 2, xs, threshold)
    const right = snapValue(x + box.width, xs, threshold)
    const xCandidates = [
      left.snapped
        ? { dist: Math.abs(x - left.value), x: left.value, guide: left.target! }
        : null,
      centerX.snapped
        ? {
            dist: Math.abs(x + box.width / 2 - centerX.value),
            x: centerX.value - box.width / 2,
            guide: centerX.target!,
          }
        : null,
      right.snapped
        ? {
            dist: Math.abs(x + box.width - right.value),
            x: right.value - box.width,
            guide: right.target!,
          }
        : null,
    ].filter(Boolean) as { dist: number; x: number; guide: number }[]

    if (xCandidates.length > 0) {
      xCandidates.sort((a, b) => a.dist - b.dist)
      x = xCandidates[0].x
      guides.push({ orientation: 'vertical', position: xCandidates[0].guide })
    }

    const top = snapValue(y, ys, threshold)
    const centerY = snapValue(y + box.height / 2, ys, threshold)
    const bottom = snapValue(y + box.height, ys, threshold)
    const yCandidates = [
      top.snapped
        ? { dist: Math.abs(y - top.value), y: top.value, guide: top.target! }
        : null,
      centerY.snapped
        ? {
            dist: Math.abs(y + box.height / 2 - centerY.value),
            y: centerY.value - box.height / 2,
            guide: centerY.target!,
          }
        : null,
      bottom.snapped
        ? {
            dist: Math.abs(y + box.height - bottom.value),
            y: bottom.value - box.height,
            guide: bottom.target!,
          }
        : null,
    ].filter(Boolean) as { dist: number; y: number; guide: number }[]

    if (yCandidates.length > 0) {
      yCandidates.sort((a, b) => a.dist - b.dist)
      y = yCandidates[0].y
      guides.push({ orientation: 'horizontal', position: yCandidates[0].guide })
    }
  }

  if (settings.snapToGrid && settings.gridSize > 0) {
    const g = settings.gridSize
    const hasV = guides.some((gde) => gde.orientation === 'vertical')
    const hasH = guides.some((gde) => gde.orientation === 'horizontal')
    if (!hasV) x = Math.round(x / g) * g
    if (!hasH) y = Math.round(y / g) * g
  }

  return { x: Math.round(x), y: Math.round(y), guides }
}

export function snapPoint(
  x: number,
  y: number,
  settings: DocSettings,
): { x: number; y: number } {
  if (!settings.snapToGrid || settings.gridSize <= 0) {
    return { x: Math.round(x), y: Math.round(y) }
  }
  const g = settings.gridSize
  return { x: Math.round(x / g) * g, y: Math.round(y / g) * g }
}
