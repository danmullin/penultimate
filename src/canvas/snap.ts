import type { ArtboardFrame, BBox, DocSettings, SnapGuide } from '../types'

export type SnapResult = {
  x: number
  y: number
  guides: SnapGuide[]
}

export type ArtboardSnapBounds = Pick<ArtboardFrame, 'x' | 'y' | 'width' | 'height'>

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

/** Edge + center lines for every artboard frame. */
function artboardAxisTargets(artboards: ArtboardSnapBounds[]): {
  xs: number[]
  ys: number[]
} {
  const xs: number[] = []
  const ys: number[] = []
  for (const a of artboards) {
    xs.push(a.x, a.x + a.width / 2, a.x + a.width)
    ys.push(a.y, a.y + a.height / 2, a.y + a.height)
  }
  return { xs, ys }
}

export function snapBBox(
  box: BBox,
  others: BBox[],
  artboards: ArtboardSnapBounds[],
  settings: DocSettings,
  manualGuides: SnapGuide[] = [],
): SnapResult {
  let x = box.x
  let y = box.y
  const guides: SnapGuide[] = []

  if (settings.snapToNeighbors) {
    const { xs: abXs, ys: abYs } = artboardAxisTargets(artboards)
    const xs = [...abXs]
    const ys = [...abYs]
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

export type ResizeEdges = {
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}

/**
 * Snap free edges of a resize toward artboard / neighbor / guide lines.
 * Anchored edges stay fixed; free edges magnetize within snapThreshold.
 */
export function snapResizeBBox(
  box: BBox,
  edges: ResizeEdges,
  others: BBox[],
  artboards: ArtboardSnapBounds[],
  settings: DocSettings,
  manualGuides: SnapGuide[] = [],
): { box: BBox; guides: SnapGuide[] } {
  const min = 4
  let left = box.x
  let right = box.x + box.width
  let top = box.y
  let bottom = box.y + box.height
  const guides: SnapGuide[] = []
  let snappedL = false
  let snappedR = false
  let snappedT = false
  let snappedB = false

  if (settings.snapToNeighbors) {
    const { xs: abXs, ys: abYs } = artboardAxisTargets(artboards)
    const xs = [...abXs]
    const ys = [...abYs]
    for (const r of others) {
      xs.push(r.x, r.x + r.width / 2, r.x + r.width)
      ys.push(r.y, r.y + r.height / 2, r.y + r.height)
    }
    for (const g of manualGuides) {
      if (g.orientation === 'vertical') xs.push(g.position)
      else ys.push(g.position)
    }
    const threshold = settings.snapThreshold

    if (edges.left) {
      const s = snapValue(left, xs, threshold)
      if (s.snapped) {
        left = s.value
        snappedL = true
        guides.push({ orientation: 'vertical', position: s.target! })
      }
    }
    if (edges.right) {
      const s = snapValue(right, xs, threshold)
      if (s.snapped) {
        right = s.value
        snappedR = true
        if (!guides.some((g) => g.orientation === 'vertical' && g.position === s.target)) {
          guides.push({ orientation: 'vertical', position: s.target! })
        }
      }
    }
    if (edges.top) {
      const s = snapValue(top, ys, threshold)
      if (s.snapped) {
        top = s.value
        snappedT = true
        guides.push({ orientation: 'horizontal', position: s.target! })
      }
    }
    if (edges.bottom) {
      const s = snapValue(bottom, ys, threshold)
      if (s.snapped) {
        bottom = s.value
        snappedB = true
        if (!guides.some((g) => g.orientation === 'horizontal' && g.position === s.target)) {
          guides.push({ orientation: 'horizontal', position: s.target! })
        }
      }
    }
  }

  if (settings.snapToGrid && settings.gridSize > 0) {
    const g = settings.gridSize
    if (edges.left && !snappedL) left = Math.round(left / g) * g
    if (edges.right && !snappedR) right = Math.round(right / g) * g
    if (edges.top && !snappedT) top = Math.round(top / g) * g
    if (edges.bottom && !snappedB) bottom = Math.round(bottom / g) * g
  } else {
    if (edges.left && !snappedL) left = Math.round(left)
    if (edges.right && !snappedR) right = Math.round(right)
    if (edges.top && !snappedT) top = Math.round(top)
    if (edges.bottom && !snappedB) bottom = Math.round(bottom)
  }

  if (right < left + min) {
    if (edges.right && !edges.left) right = left + min
    else if (edges.left && !edges.right) left = right - min
    else right = left + min
  }
  if (bottom < top + min) {
    if (edges.bottom && !edges.top) bottom = top + min
    else if (edges.top && !edges.bottom) top = bottom - min
    else bottom = top + min
  }

  return {
    box: {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    },
    guides,
  }
}

/**
 * Point snap for creating shapes / pen. Magnetic artboard edges+centers when
 * smart guides (`snapToNeighbors`) are on; grid fills in remaining axes.
 */
export function snapPoint(
  x: number,
  y: number,
  settings: DocSettings,
  artboards: ArtboardSnapBounds[] = [],
): { x: number; y: number; guides: SnapGuide[] } {
  let sx = x
  let sy = y
  const guides: SnapGuide[] = []

  if (settings.snapToNeighbors && artboards.length > 0) {
    const { xs, ys } = artboardAxisTargets(artboards)
    const threshold = settings.snapThreshold
    const snappedX = snapValue(sx, xs, threshold)
    const snappedY = snapValue(sy, ys, threshold)
    if (snappedX.snapped) {
      sx = snappedX.value
      guides.push({ orientation: 'vertical', position: snappedX.target! })
    }
    if (snappedY.snapped) {
      sy = snappedY.value
      guides.push({ orientation: 'horizontal', position: snappedY.target! })
    }
  }

  if (settings.snapToGrid && settings.gridSize > 0) {
    const g = settings.gridSize
    const hasV = guides.some((gde) => gde.orientation === 'vertical')
    const hasH = guides.some((gde) => gde.orientation === 'horizontal')
    if (!hasV) sx = Math.round(sx / g) * g
    if (!hasH) sy = Math.round(sy / g) * g
  } else {
    if (!guides.some((g) => g.orientation === 'vertical')) sx = Math.round(sx)
    if (!guides.some((g) => g.orientation === 'horizontal')) sy = Math.round(sy)
  }

  return { x: sx, y: sy, guides }
}
