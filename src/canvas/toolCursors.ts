import { assetUrl } from '../assetUrl'
import type { Tool } from '../types'

/** Cursor asset name under /cursors/{name}.svg */
export type CursorName =
  | 'select'
  | 'direct'
  | 'pen'
  | 'pen-add'
  | 'pen-remove'
  | 'pen-close'
  | 'pencil'
  | 'eyedropper'
  | 'text'
  | 'line'
  | 'rect'
  | 'rounded-rect'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'move'
  | 'precision'
  | 'scissors'
  | 'shear'
  | 'zoom'
  | 'hand'
  | 'hand-closed'
  | 'area-text'

type Hotspot = { x: number; y: number; fallback: string }

const HOTSPOTS: Record<CursorName, Hotspot> = {
  select: { x: 5, y: 2, fallback: 'default' },
  direct: { x: 5, y: 2, fallback: 'default' },
  pen: { x: 4, y: 28, fallback: 'crosshair' },
  'pen-add': { x: 4, y: 28, fallback: 'crosshair' },
  'pen-remove': { x: 4, y: 28, fallback: 'crosshair' },
  'pen-close': { x: 4, y: 28, fallback: 'crosshair' },
  pencil: { x: 4, y: 28, fallback: 'crosshair' },
  eyedropper: { x: 5, y: 28, fallback: 'crosshair' },
  text: { x: 16, y: 16, fallback: 'text' },
  'area-text': { x: 16, y: 16, fallback: 'text' },
  line: { x: 16, y: 16, fallback: 'crosshair' },
  rect: { x: 16, y: 16, fallback: 'crosshair' },
  'rounded-rect': { x: 16, y: 16, fallback: 'crosshair' },
  ellipse: { x: 16, y: 16, fallback: 'crosshair' },
  polygon: { x: 16, y: 16, fallback: 'crosshair' },
  star: { x: 16, y: 16, fallback: 'crosshair' },
  move: { x: 16, y: 16, fallback: 'move' },
  precision: { x: 16, y: 16, fallback: 'crosshair' },
  scissors: { x: 16, y: 16, fallback: 'crosshair' },
  shear: { x: 16, y: 16, fallback: 'ew-resize' },
  zoom: { x: 11, y: 11, fallback: 'zoom-in' },
  hand: { x: 16, y: 16, fallback: 'grab' },
  'hand-closed': { x: 16, y: 16, fallback: 'grabbing' },
}

/** Inlined so Hand never depends on a public SVG fetch (and stays high-contrast on paper). */
const HAND_OPEN_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" d="M12.5 3.2c1 0 1.8.8 1.8 1.8v8.2h.4V2.6c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v10.6h.4V4.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v11.2h.3V6.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v12.8c0 4.4-3.1 7.4-7.4 7.4h-1.6c-4.2 0-7.1-3-7.1-7.4v-6.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V16h.4V5c0-1 .8-1.8 1.8-1.8z"/></svg>',
  )

const HAND_CLOSED_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" d="M9.5 14.2c0-1.5 1.2-2.7 2.7-2.7h1.4v-1.6c0-1.1.9-2 2-2s2 .9 2 2v1.6h.5V10c0-1.1.9-2 2-2s2 .9 2 2v2.5h.4v-1.6c0-1.1.9-2 2-2s2 .9 2 2v7.2c0 3.4-2.4 5.8-5.8 5.8h-1.6c-3.5 0-5.8-2.4-5.8-5.8v-2.5z"/></svg>',
  )

const TOOL_CURSOR: Record<Tool, CursorName> = {
  select: 'select',
  direct: 'direct',
  pen: 'pen',
  pencil: 'pencil',
  eyedropper: 'eyedropper',
  text: 'text',
  'area-text': 'area-text',
  line: 'line',
  rect: 'rect',
  'rounded-rect': 'rounded-rect',
  ellipse: 'ellipse',
  polygon: 'polygon',
  star: 'star',
  scissors: 'scissors',
  shear: 'shear',
  hand: 'hand',
  zoom: 'zoom',
}

export function cursorForTool(tool: Tool): CursorName {
  return TOOL_CURSOR[tool]
}

/** Image URL for the floating tool cursor overlay. */
export function cursorImageUrl(name: CursorName): string {
  if (name === 'hand') return HAND_OPEN_DATA
  if (name === 'hand-closed') return HAND_CLOSED_DATA
  return assetUrl(`cursors/${name}.svg`)
}

/** CSS cursor value with hotspot + system fallback. */
export function cssCursor(name: CursorName): string {
  const h = HOTSPOTS[name]
  return `url("${cursorImageUrl(name)}") ${h.x} ${h.y}, ${h.fallback}`
}

/** Prefer inherit so the host overlay cursor reads through shapes. */
export function cssCursorForTool(_tool: Tool): string {
  return 'none'
}
