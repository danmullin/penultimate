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

/** Windows-style white hand + black outline (locked — OS grab inverts on light/dark). */
const HAND_OPEN_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="#fff" stroke="#111" stroke-width="1.35" stroke-linejoin="round"><rect x="9.2" y="4.2" width="3.1" height="11.8" rx="1.55"/><rect x="12.9" y="2.6" width="3.1" height="13.4" rx="1.55"/><rect x="16.6" y="3.4" width="3.1" height="12.6" rx="1.55"/><rect x="20.3" y="5.6" width="3.1" height="10.4" rx="1.55"/><path d="M8.4 14.8h15.8v6.2c0 3.1-2.4 5.5-5.6 5.5h-4.6c-3.2 0-5.6-2.4-5.6-5.5v-6.2z"/><rect x="4.6" y="13.4" width="6.4" height="3.1" rx="1.55" transform="rotate(-32 7.8 15)"/></g></svg>',
  )

const HAND_CLOSED_DATA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="#fff" stroke="#111" stroke-width="1.35" stroke-linejoin="round"><path d="M8.8 13.6c0-1.3 1-2.3 2.3-2.3h12c1.3 0 2.3 1 2.3 2.3v6.4c0 3.1-2.3 5.4-5.4 5.4h-6c-3 0-5.2-2.3-5.2-5.4v-6.4z"/><rect x="9.6" y="9.6" width="3" height="4.4" rx="1.5"/><rect x="13.2" y="8.6" width="3" height="5.4" rx="1.5"/><rect x="16.8" y="8.2" width="3" height="5.8" rx="1.5"/><rect x="20.4" y="9" width="3" height="5" rx="1.5"/><rect x="5.4" y="14.2" width="5.2" height="3" rx="1.5" transform="rotate(-38 8 15.7)"/></g></svg>',
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
