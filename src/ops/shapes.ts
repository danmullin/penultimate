import { round2 } from '../geometry'
import { paintNone } from '../style/paint'
import {
  defaultStyle,
  type ShapePrimitive,
  type VecNode,
} from '../types'

/** Regular polygon centered at (cx, cy). */
export function polygonPath(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
): string {
  const n = Math.max(3, Math.round(sides))
  const r = Math.max(1, radius)
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    pts.push(`${round2(cx + Math.cos(a) * r)} ${round2(cy + Math.sin(a) * r)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

/** 5-point star (or custom points). */
export function starPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points = 5,
): string {
  const n = Math.max(3, Math.round(points))
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n
    const r = i % 2 === 0 ? outerR : innerR
    pts.push(`${round2(cx + Math.cos(a) * r)} ${round2(cy + Math.sin(a) * r)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

export function roundedRectHint(rx: number, size: number): number {
  return Math.max(0, Math.min(rx, size / 2))
}

export function pathFromPrimitive(p: ShapePrimitive): string {
  if (p.kind === 'polygon') {
    return polygonPath(p.cx, p.cy, p.radius, p.sides)
  }
  return starPath(p.cx, p.cy, p.outerRadius, p.innerRadius, p.points)
}

export function translatePrimitive(p: ShapePrimitive, dx: number, dy: number): ShapePrimitive {
  return {
    ...p,
    cx: round2(p.cx + dx),
    cy: round2(p.cy + dy),
  }
}

export function scalePrimitive(
  p: ShapePrimitive,
  mapX: (x: number) => number,
  mapY: (y: number) => number,
  sx: number,
  sy: number,
): ShapePrimitive {
  const s = (Math.abs(sx) + Math.abs(sy)) / 2
  if (p.kind === 'polygon') {
    return {
      ...p,
      cx: mapX(p.cx),
      cy: mapY(p.cy),
      radius: Math.max(1, round2(p.radius * s)),
    }
  }
  return {
    ...p,
    cx: mapX(p.cx),
    cy: mapY(p.cy),
    outerRadius: Math.max(1, round2(p.outerRadius * s)),
    innerRadius: Math.max(0.5, round2(p.innerRadius * s)),
  }
}

export type ShapeToolKind =
  | 'rect'
  | 'rounded-rect'
  | 'ellipse'
  | 'line'
  | 'polygon'
  | 'star'

export type ShapeCreateValues = {
  width: number
  height: number
  rx: number
  sides: number
  points: number
  radius: number
  innerRadius: number
  length: number
  angle: number
}

export const DEFAULT_SHAPE_VALUES: ShapeCreateValues = {
  width: 100,
  height: 100,
  rx: 16,
  sides: 6,
  points: 5,
  radius: 50,
  innerRadius: 22,
  length: 100,
  angle: 0,
}

/** Last confirmed dialog values (session memory). */
let lastShapeValues: ShapeCreateValues = { ...DEFAULT_SHAPE_VALUES }

export function getLastShapeValues(): ShapeCreateValues {
  return { ...lastShapeValues }
}

export function rememberShapeValues(partial: Partial<ShapeCreateValues>): void {
  lastShapeValues = { ...lastShapeValues, ...partial }
}

export function shapeToolTitle(kind: ShapeToolKind): string {
  switch (kind) {
    case 'rect':
      return 'Rectangle'
    case 'rounded-rect':
      return 'Rounded Rectangle'
    case 'ellipse':
      return 'Ellipse'
    case 'line':
      return 'Line'
    case 'polygon':
      return 'Polygon'
    case 'star':
      return 'Star'
  }
}

/** Build a real node from click origin + exact sizes (Illustrator-style dialog). */
export function createShapeFromValues(
  kind: ShapeToolKind,
  originX: number,
  originY: number,
  values: ShapeCreateValues,
): VecNode {
  const style = defaultStyle()
  const w = Math.max(1, values.width)
  const h = Math.max(1, values.height)

  if (kind === 'line') {
    const rad = (values.angle * Math.PI) / 180
    const len = Math.max(1, values.length)
    return {
      id: 'draft',
      type: 'line',
      name: 'Line',
      visible: true,
      locked: false,
      rotation: 0,
      style: { ...style, fill: paintNone() },
      x1: round2(originX),
      y1: round2(originY),
      x2: round2(originX + Math.cos(rad) * len),
      y2: round2(originY + Math.sin(rad) * len),
    }
  }

  if (kind === 'polygon') {
    const primitive: ShapePrimitive = {
      kind: 'polygon',
      cx: round2(originX),
      cy: round2(originY),
      radius: Math.max(1, values.radius),
      sides: Math.max(3, Math.round(values.sides)),
    }
    return {
      id: 'draft',
      type: 'path',
      name: 'Polygon',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      d: pathFromPrimitive(primitive),
      primitive,
    }
  }

  if (kind === 'star') {
    const primitive: ShapePrimitive = {
      kind: 'star',
      cx: round2(originX),
      cy: round2(originY),
      outerRadius: Math.max(1, values.radius),
      innerRadius: Math.max(0.5, values.innerRadius),
      points: Math.max(3, Math.round(values.points)),
    }
    return {
      id: 'draft',
      type: 'path',
      name: 'Star',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      d: pathFromPrimitive(primitive),
      primitive,
    }
  }

  if (kind === 'ellipse') {
    return {
      id: 'draft',
      type: 'ellipse',
      name: 'Ellipse',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      cx: round2(originX),
      cy: round2(originY),
      rx: round2(w / 2),
      ry: round2(h / 2),
    }
  }

  // rect / rounded-rect — origin is top-left
  return {
    id: 'draft',
    type: 'rect',
    name: kind === 'rounded-rect' ? 'Rounded Rect' : 'Rectangle',
    visible: true,
    locked: false,
    rotation: 0,
    style,
    x: round2(originX),
    y: round2(originY),
    width: round2(w),
    height: round2(h),
    rx:
      kind === 'rounded-rect'
        ? roundedRectHint(values.rx, Math.min(w, h))
        : undefined,
  }
}
