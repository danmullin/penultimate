import { nextId } from '../ops/group'
import {
  defaultStyle,
  normalizeNode,
  type VecNode,
  type VectorDocument,
} from '../types'
import { paintNone, paintSolid } from '../style/paint'

function attr(el: Element, name: string, fallback = ''): string {
  return el.getAttribute(name) ?? fallback
}

function num(el: Element, name: string, fallback = 0): number {
  const v = Number(attr(el, name, String(fallback)))
  return Number.isFinite(v) ? v : fallback
}

function styleFromElement(el: Element) {
  const style = defaultStyle()
  const fill = attr(el, 'fill')
  const stroke = attr(el, 'stroke')
  const sw = num(el, 'stroke-width', 1)
  if (fill === 'none') style.fill = paintNone()
  else if (fill) style.fill = paintSolid(fill)
  if (stroke === 'none' || !stroke) style.stroke = paintNone()
  else style.stroke = paintSolid(stroke)
  style.strokeWidth = sw
  const op = Number(attr(el, 'opacity', '1'))
  if (Number.isFinite(op)) style.opacity = Math.max(0, Math.min(1, op))
  const dash = attr(el, 'stroke-dasharray')
  if (dash) style.strokeDasharray = dash
  const cap = attr(el, 'stroke-linecap')
  if (cap === 'round' || cap === 'square' || cap === 'butt') style.strokeLinecap = cap
  const join = attr(el, 'stroke-linejoin')
  if (join === 'round' || join === 'bevel' || join === 'miter') style.strokeLinejoin = join
  return style
}

function elementToNode(el: Element, offsetX: number, offsetY: number): VecNode | null {
  const tag = el.tagName.toLowerCase()
  const style = styleFromElement(el)

  if (tag === 'rect') {
    return normalizeNode({
      id: nextId('rect'),
      type: 'rect',
      name: 'Rect',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      x: num(el, 'x') + offsetX,
      y: num(el, 'y') + offsetY,
      width: Math.max(1, num(el, 'width', 1)),
      height: Math.max(1, num(el, 'height', 1)),
      rx: num(el, 'rx') || undefined,
    })
  }
  if (tag === 'ellipse') {
    return normalizeNode({
      id: nextId('ellipse'),
      type: 'ellipse',
      name: 'Ellipse',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      cx: num(el, 'cx') + offsetX,
      cy: num(el, 'cy') + offsetY,
      rx: Math.max(0.5, num(el, 'rx', 1)),
      ry: Math.max(0.5, num(el, 'ry', 1)),
    })
  }
  if (tag === 'circle') {
    const r = Math.max(0.5, num(el, 'r', 1))
    return normalizeNode({
      id: nextId('ellipse'),
      type: 'ellipse',
      name: 'Circle',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      cx: num(el, 'cx') + offsetX,
      cy: num(el, 'cy') + offsetY,
      rx: r,
      ry: r,
    })
  }
  if (tag === 'line') {
    return normalizeNode({
      id: nextId('line'),
      type: 'line',
      name: 'Line',
      visible: true,
      locked: false,
      rotation: 0,
      style: { ...style, fill: paintNone() },
      x1: num(el, 'x1') + offsetX,
      y1: num(el, 'y1') + offsetY,
      x2: num(el, 'x2') + offsetX,
      y2: num(el, 'y2') + offsetY,
    })
  }
  if (tag === 'path') {
    const d = attr(el, 'd')
    if (!d) return null
    return normalizeNode({
      id: nextId('path'),
      type: 'path',
      name: 'Path',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      d,
    })
  }
  if (tag === 'text') {
    return normalizeNode({
      id: nextId('text'),
      type: 'text',
      name: (el.textContent || 'Text').slice(0, 24),
      visible: true,
      locked: false,
      rotation: 0,
      style: { ...style, stroke: paintNone() },
      x: num(el, 'x') + offsetX,
      y: num(el, 'y') + offsetY,
      text: el.textContent || 'Text',
      fontSize: num(el, 'font-size', 24) || 24,
      fontFamily: attr(el, 'font-family', 'Segoe UI, system-ui, sans-serif'),
      fontWeight: attr(el, 'font-weight') === 'bold' || num(el, 'font-weight') >= 600 ? 'bold' : 'normal',
      fontStyle: attr(el, 'font-style') === 'italic' ? 'italic' : 'normal',
    })
  }
  if (tag === 'polyline' || tag === 'polygon') {
    const pts = attr(el, 'points')
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n))
    if (pts.length < 4) return null
    const pairs: string[] = []
    for (let i = 0; i + 1 < pts.length; i += 2) {
      pairs.push(`${pts[i] + offsetX} ${pts[i + 1] + offsetY}`)
    }
    const d = `M ${pairs.join(' L ')}${tag === 'polygon' ? ' Z' : ''}`
    return normalizeNode({
      id: nextId('path'),
      type: 'path',
      name: tag === 'polygon' ? 'Polygon' : 'Polyline',
      visible: true,
      locked: false,
      rotation: 0,
      style,
      d,
    })
  }
  return null
}

function walk(
  el: Element,
  out: VecNode[],
  offsetX: number,
  offsetY: number,
): void {
  const tag = el.tagName.toLowerCase()
  if (tag === 'defs' || tag === 'clippath' || tag === 'mask' || tag === 'style') return
  if (tag === 'g' || tag === 'svg') {
    for (const child of Array.from(el.children)) {
      walk(child, out, offsetX, offsetY)
    }
    return
  }
  const node = elementToNode(el, offsetX, offsetY)
  if (node) out.push(node)
}

/** Parse SVG markup into document nodes (appended to existing doc). */
export function importSvgIntoDocument(
  svgText: string,
  doc: VectorDocument,
): VectorDocument {
  const parser = new DOMParser()
  const parsed = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = parsed.querySelector('svg')
  if (!svg) throw new Error('No <svg> root found')

  const nodesOut: VecNode[] = []
  walk(svg, nodesOut, 0, 0)
  if (nodesOut.length === 0) throw new Error('No supported shapes in SVG')

  const nodes = { ...doc.nodes }
  const zOrder = [...doc.zOrder]
  for (const n of nodesOut) {
    nodes[n.id] = n
    zOrder.push(n.id)
  }

  const vb = attr(svg, 'viewBox').split(/[\s,]+/).map(Number)
  const w = num(svg, 'width', vb[2] || doc.artboard.width)
  const h = num(svg, 'height', vb[3] || doc.artboard.height)

  return {
    ...doc,
    artboard: {
      ...doc.artboard,
      width: Math.max(doc.artboard.width, Math.round(w) || doc.artboard.width),
      height: Math.max(doc.artboard.height, Math.round(h) || doc.artboard.height),
    },
    artboards: doc.artboards.map((a) =>
      a.id === doc.activeArtboardId
        ? {
            ...a,
            width: Math.max(a.width, Math.round(w) || a.width),
            height: Math.max(a.height, Math.round(h) || a.height),
          }
        : a,
    ),
    nodes,
    zOrder,
  }
}

export async function openSvgFile(): Promise<string | null> {
  const anyWindow = window as Window & {
    showOpenFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle[]>
  }
  if (anyWindow.showOpenFilePicker) {
    try {
      const [handle] = await anyWindow.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'SVG',
            accept: { 'image/svg+xml': ['.svg'] },
          },
        ],
      })
      const file = await handle.getFile()
      return await file.text()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.svg,image/svg+xml'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      resolve(await file.text())
    }
    input.click()
  })
}
