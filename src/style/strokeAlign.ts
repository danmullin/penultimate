import type { VecNode } from '../types'

export type StrokeAlign = 'center' | 'inside' | 'outside'

export function normalizeStrokeAlign(raw: unknown): StrokeAlign {
  if (raw === 'inside' || raw === 'outside' || raw === 'center') return raw
  return 'center'
}

/** Open lines / open paths can't meaningfully use inside/outside. */
export function supportsStrokeAlign(node: VecNode): boolean {
  if (node.type === 'line' || node.type === 'group' || node.type === 'image') return false
  if (node.type === 'path') return /[Zz]\s*$/.test(node.d.trim())
  return node.type === 'rect' || node.type === 'ellipse' || node.type === 'text'
}

export function effectiveStrokeAlign(node: VecNode): StrokeAlign {
  if (!supportsStrokeAlign(node)) return 'center'
  return node.style.strokeAlign ?? 'center'
}
