import {
  paintAttrValue,
  paintNeedsDef,
  paintToSvgDef,
} from '../style/paint'
import { effectiveStrokeAlign } from '../style/strokeAlign'
import type { VecNode, VectorDocument } from '../types'

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function transformAttr(node: VecNode, cx: number, cy: number): string {
  if (!node.rotation) return ''
  return ` transform="rotate(${node.rotation} ${cx} ${cy})"`
}

type PaintSlice = {
  fill: string
  stroke: string
  strokeWidth: number
  paintOrder?: string
  clipPath?: string
  pointerEvents?: string
  strokeLinecap?: string
  strokeLinejoin?: string
  strokeDasharray?: string
  markerEnd?: string
}

function strokeExtras(node: VecNode): Partial<PaintSlice> {
  const s = node.style
  return {
    strokeLinecap: s.strokeLinecap,
    strokeLinejoin: s.strokeLinejoin,
    strokeDasharray: s.strokeDasharray || undefined,
    markerEnd: s.strokeArrow ? `url(#arrow-${node.id})` : undefined,
  }
}

function geomOpen(node: VecNode, paint: PaintSlice): string {
  const attrs = [
    `fill="${paint.fill}"`,
    `stroke="${paint.stroke}"`,
    `stroke-width="${paint.strokeWidth}"`,
  ]
  if (paint.paintOrder) attrs.push(`paint-order="${paint.paintOrder}"`)
  if (paint.clipPath) attrs.push(`clip-path="${paint.clipPath}"`)
  if (paint.pointerEvents) attrs.push(`pointer-events="${paint.pointerEvents}"`)
  if (paint.strokeLinecap) attrs.push(`stroke-linecap="${paint.strokeLinecap}"`)
  if (paint.strokeLinejoin) attrs.push(`stroke-linejoin="${paint.strokeLinejoin}"`)
  if (paint.strokeDasharray) attrs.push(`stroke-dasharray="${paint.strokeDasharray}"`)
  if (paint.markerEnd) attrs.push(`marker-end="${paint.markerEnd}"`)
  const a = attrs.join(' ')

  switch (node.type) {
    case 'rect': {
      const rx = node.rx ? ` rx="${node.rx}"` : ''
      return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${rx} ${a}${transformAttr(node, node.x + node.width / 2, node.y + node.height / 2)} />`
    }
    case 'ellipse':
      return `<ellipse cx="${node.cx}" cy="${node.cy}" rx="${node.rx}" ry="${node.ry}" ${a}${transformAttr(node, node.cx, node.cy)} />`
    case 'line':
      return `<line x1="${node.x1}" y1="${node.y1}" x2="${node.x2}" y2="${node.y2}" ${a}${transformAttr(node, (node.x1 + node.x2) / 2, (node.y1 + node.y2) / 2)} />`
    case 'text':
      if (node.width && node.height && node.width > 0 && node.height > 0) {
        return `<foreignObject x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${transformAttr(node, node.x + node.width / 2, node.y + node.height / 2)}><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;overflow:hidden;color:${paint.fill === 'none' ? '#111' : paint.fill};font-size:${node.fontSize}px;font-family:${esc(node.fontFamily)};font-weight:${node.fontWeight};font-style:${node.fontStyle};line-height:1.25;white-space:pre-wrap;word-break:break-word;padding:2px;box-sizing:border-box">${esc(node.text)}</div></foreignObject>`
      }
      return `<text x="${node.x}" y="${node.y}" font-size="${node.fontSize}" font-family="${esc(node.fontFamily)}" font-weight="${node.fontWeight}" font-style="${node.fontStyle}" ${a}${transformAttr(node, node.x, node.y)}>${esc(node.text)}</text>`
    case 'path':
      return `<path d="${esc(node.d)}" ${a}${node.rotation ? transformAttr(node, 0, 0) : ''} />`
    case 'image':
      return `<image href="${esc(node.href)}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" preserveAspectRatio="none"${transformAttr(node, node.x + node.width / 2, node.y + node.height / 2)} />`
    case 'group':
      return ''
  }
}

function effectWrap(node: VecNode, inner: string): string {
  const blend =
    node.style.blendMode && node.style.blendMode !== 'normal'
      ? ` style="mix-blend-mode:${node.style.blendMode}"`
      : ''
  const shadow = node.style.shadow
  if (shadow?.enabled) {
    const fid = `drop-shadow-${node.id}`
    return `<g${blend} filter="url(#${fid})"><defs><filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${shadow.dx}" dy="${shadow.dy}" stdDeviation="${Math.max(0, shadow.blur / 2)}" flood-color="${esc(shadow.color)}" flood-opacity="${shadow.opacity}"/></filter></defs>${inner}</g>`
  }
  if (blend) return `<g${blend}>${inner}</g>`
  return inner
}

function renderPainted(node: Exclude<VecNode, { type: 'group' }>): string {
  if (node.type === 'image') {
    return effectWrap(
      node,
      `<g opacity="${node.style.opacity}">${geomOpen(node, {
        fill: 'none',
        stroke: 'none',
        strokeWidth: 0,
      })}</g>`,
    )
  }
  const fill = paintAttrValue(node.style.fill, `fill-${node.id}`)
  const stroke = paintAttrValue(node.style.stroke, `stroke-${node.id}`)
  const width = node.style.strokeWidth
  const hasFill = node.style.fill.type !== 'none'
  const hasStroke = node.style.stroke.type !== 'none' && width > 0
  const alignRaw = effectiveStrokeAlign(node)
  const align = alignRaw === 'outside' && !hasFill ? 'center' : alignRaw
  const opacity = node.style.opacity

  if (!hasStroke || align === 'center') {
    const marker =
      node.style.strokeArrow && hasStroke
        ? `<defs><marker id="arrow-${node.id}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,3 L0,6 Z" fill="${stroke.startsWith('url') ? '#333' : stroke}"/></marker></defs>`
        : ''
    return effectWrap(
      node,
      `<g opacity="${opacity}">${marker}${geomOpen(node, {
        fill: hasFill ? fill : 'none',
        stroke: hasStroke ? stroke : 'none',
        strokeWidth: width,
        paintOrder: 'fill stroke',
        ...strokeExtras(node),
      })}</g>`,
    )
  }

  if (align === 'outside') {
    const layers = [
      hasStroke
        ? geomOpen(node, { fill: 'none', stroke, strokeWidth: width * 2 })
        : '',
      geomOpen(node, {
        fill: hasFill ? fill : 'none',
        stroke: 'none',
        strokeWidth: 0,
      }),
    ]
      .filter(Boolean)
      .join('\n')
    return effectWrap(node, `<g opacity="${opacity}">\n${layers}\n</g>`)
  }

  // inside
  const clipId = `clip-${node.id}`
  const clipGeom = geomOpen(node, { fill: '#000', stroke: 'none', strokeWidth: 0 })
  const layers = [
    hasFill
      ? geomOpen(node, { fill, stroke: 'none', strokeWidth: 0 })
      : '',
    hasStroke
      ? `<g clip-path="url(#${clipId})">${geomOpen(node, {
          fill: 'none',
          stroke,
          strokeWidth: width * 2,
        })}</g>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  return effectWrap(
    node,
    `<g opacity="${opacity}">
<defs><clipPath id="${clipId}">${clipGeom}</clipPath></defs>
${layers}
</g>`,
  )
}

function renderNode(node: VecNode, doc: VectorDocument): string {
  if (!node.visible) return ''
  if (node.type === 'group') {
    const children = node.children.map((id) => doc.nodes[id]).filter(Boolean)
    if (node.clipped && children.length >= 1) {
      const [mask, ...content] = children
      const clipId = `user-clip-${node.id}`
      const clipGeom =
        mask.type !== 'group'
          ? geomOpen(mask, { fill: '#000', stroke: 'none', strokeWidth: 0 })
          : ''
      const kids = content.map((n) => renderNode(n, doc)).join('\n')
      return `<g data-name="${esc(node.name)}"${node.rotation ? transformAttr(node, node.x, node.y) : ''}>
<defs><clipPath id="${clipId}">${clipGeom}</clipPath></defs>
${renderNode(mask, doc)}
<g clip-path="url(#${clipId})">${kids}</g>
</g>`
    }
    const kids = children.map((n) => renderNode(n, doc)).join('\n')
    return `<g data-name="${esc(node.name)}"${node.rotation ? transformAttr(node, node.x, node.y) : ''}>\n${kids}\n</g>`
  }
  return renderPainted(node)
}

function collectDefs(doc: VectorDocument): string {
  const parts: string[] = []
  for (const node of Object.values(doc.nodes)) {
    if (paintNeedsDef(node.style.fill)) {
      parts.push(paintToSvgDef(node.style.fill, `fill-${node.id}`))
    }
    if (paintNeedsDef(node.style.stroke)) {
      parts.push(paintToSvgDef(node.style.stroke, `stroke-${node.id}`))
    }
  }
  if (parts.length === 0) return ''
  return `<defs>\n${parts.join('\n')}\n</defs>`
}

export function documentToSvg(doc: VectorDocument): string {
  const frame =
    doc.artboards.find((a) => a.id === doc.activeArtboardId) ?? doc.artboards[0]
  const x = frame?.x ?? 0
  const y = frame?.y ?? 0
  const width = frame?.width ?? doc.artboard.width
  const height = frame?.height ?? doc.artboard.height
  const background =
    frame?.background !== undefined ? frame.background : doc.artboard.background

  const bg =
    background != null
      ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${background}" />`
      : ''
  const body = doc.zOrder
    .map((id) => doc.nodes[id])
    .filter(Boolean)
    .map((n) => renderNode(n, doc))
    .join('\n')

  // Crop to the active artboard frame: translate world coords into frame-local space.
  const content =
    x !== 0 || y !== 0
      ? `<g transform="translate(${-x}, ${-y})">\n${body}\n</g>`
      : body

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${collectDefs(doc)}
${bg}
${content}
</svg>`
}

export function downloadText(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
