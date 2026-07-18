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
  hand: { x: 7, y: 5, fallback: 'grab' },
  'hand-closed': { x: 7, y: 5, fallback: 'grabbing' },
}

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
  // Real Windows-style grab cursors (from classic openhand/closedhand .cur).
  if (name === 'hand') return assetUrl('cursors/hand.png')
  if (name === 'hand-closed') return assetUrl('cursors/hand-closed.png')
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
