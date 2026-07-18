export type GradientStop = {
  offset: number
  color: string
}

export type Paint =
  | { type: 'none' }
  | { type: 'solid'; color: string }
  | {
      type: 'linear'
      /** Object-bounding-box units 0–1 */
      x1: number
      y1: number
      x2: number
      y2: number
      stops: GradientStop[]
    }
  | {
      type: 'radial'
      cx: number
      cy: number
      r: number
      stops: GradientStop[]
    }

export function paintNone(): Paint {
  return { type: 'none' }
}

export function paintSolid(color: string): Paint {
  return { type: 'solid', color }
}

export function defaultLinearPaint(
  from = '#ffffff',
  to = '#000000',
): Paint {
  return {
    type: 'linear',
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1,
    stops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  }
}

export function defaultRadialPaint(
  from = '#ffffff',
  to = '#000000',
): Paint {
  return {
    type: 'radial',
    cx: 0.5,
    cy: 0.5,
    r: 0.75,
    stops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  }
}

/** Accepts new Paint objects or legacy string | null. */
export function normalizePaint(raw: unknown, fallback: Paint = paintNone()): Paint {
  if (raw == null) return { type: 'none' }
  if (typeof raw === 'string') {
    if (raw === '' || raw === 'none') return { type: 'none' }
    return { type: 'solid', color: raw }
  }
  if (typeof raw !== 'object') return fallback
  const p = raw as Record<string, unknown>
  if (p.type === 'none') return { type: 'none' }
  if (p.type === 'solid' && typeof p.color === 'string') {
    return { type: 'solid', color: p.color }
  }
  if (p.type === 'linear') {
    const stops = normalizeStops(p.stops)
    const fallback = defaultLinearPaint()
    return {
      type: 'linear',
      x1: num(p.x1, 0),
      y1: num(p.y1, 0),
      x2: num(p.x2, 1),
      y2: num(p.y2, 1),
      stops: stops.length >= 2 ? stops : fallback.type === 'linear' ? fallback.stops : stops,
    }
  }
  if (p.type === 'radial') {
    const stops = normalizeStops(p.stops)
    const fallback = defaultRadialPaint()
    return {
      type: 'radial',
      cx: num(p.cx, 0.5),
      cy: num(p.cy, 0.5),
      r: num(p.r, 0.75),
      stops: stops.length >= 2 ? stops : fallback.type === 'radial' ? fallback.stops : stops,
    }
  }
  return fallback
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function normalizeStops(raw: unknown): GradientStop[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s) => {
      if (!s || typeof s !== 'object') return null
      const o = s as Record<string, unknown>
      if (typeof o.color !== 'string') return null
      return {
        offset: Math.max(0, Math.min(1, num(o.offset, 0))),
        color: o.color,
      }
    })
    .filter(Boolean) as GradientStop[]
}

export function paintCssPreview(paint: Paint): string {
  switch (paint.type) {
    case 'none':
      return 'transparent'
    case 'solid':
      return paint.color
    case 'linear':
      return `linear-gradient(${paint.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`
    case 'radial':
      return `radial-gradient(circle, ${paint.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`
  }
}

/** Resolve fill/stroke attribute value; gradient paints use url(#id). */
export function paintAttrValue(paint: Paint, gradientId: string): string {
  switch (paint.type) {
    case 'none':
      return 'none'
    case 'solid':
      return paint.color
    case 'linear':
    case 'radial':
      return `url(#${gradientId})`
  }
}

export function paintNeedsDef(paint: Paint): boolean {
  return paint.type === 'linear' || paint.type === 'radial'
}

export function paintToSvgDef(paint: Paint, id: string): string {
  if (paint.type === 'linear') {
    const stops = paint.stops
      .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`)
      .join('')
    return `<linearGradient id="${id}" gradientUnits="objectBoundingBox" x1="${paint.x1}" y1="${paint.y1}" x2="${paint.x2}" y2="${paint.y2}">${stops}</linearGradient>`
  }
  if (paint.type === 'radial') {
    const stops = paint.stops
      .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`)
      .join('')
    return `<radialGradient id="${id}" gradientUnits="objectBoundingBox" cx="${paint.cx}" cy="${paint.cy}" r="${paint.r}">${stops}</radialGradient>`
  }
  return ''
}
