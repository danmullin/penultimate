import { hexToRgb, normalizeHex, rgbToHex } from '../color/colorMath'
import type { ChromaKey, ChromaKeyEntry, ImageNode } from '../types'

function loadImage(href: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.crossOrigin = 'anonymous'
    img.src = href
  })
}

/** Original raster before chroma-key processing. */
export function imageSourceHref(node: ImageNode): string {
  return node.chromaKey?.sourceHref ?? node.href
}

function pixelMatchesEntry(
  r: number,
  g: number,
  b: number,
  entry: ChromaKeyEntry,
): boolean {
  const target = hexToRgb(entry.color)
  if (!target) return false
  const tol = Math.max(0, entry.tolerance)
  if (tol <= 0) return rgbToHex(r, g, b) === normalizeHex(entry.color)
  const dr = r - target.r
  const dg = g - target.g
  const db = b - target.b
  return dr * dr + dg * dg + db * db <= tol * tol
}

/** Remove pixels within each entry's RGB tolerance. */
export async function applyChromaKey(
  href: string,
  entries: ChromaKeyEntry[],
): Promise<string> {
  const valid = entries.filter((e) => normalizeHex(e.color))
  if (valid.length === 0) return href

  const img = await loadImage(href)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return href

  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]!
    const g = px[i + 1]!
    const b = px[i + 2]!
    if (valid.some((entry) => pixelMatchesEntry(r, g, b, entry))) px[i + 3] = 0
  }
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL('image/png')
}

/** Map a point inside the image node box to a pixel color (preserveAspectRatio meet). */
export async function sampleImagePixelHex(
  href: string,
  localX: number,
  localY: number,
  boxWidth: number,
  boxHeight: number,
): Promise<string | null> {
  const img = await loadImage(href)
  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  if (imgW <= 0 || imgH <= 0 || boxWidth <= 0 || boxHeight <= 0) return null

  const imgAspect = imgW / imgH
  const boxAspect = boxWidth / boxHeight
  let drawW: number
  let drawH: number
  let offsetX: number
  let offsetY: number
  if (imgAspect > boxAspect) {
    drawW = boxWidth
    drawH = boxWidth / imgAspect
    offsetX = 0
    offsetY = (boxHeight - drawH) / 2
  } else {
    drawH = boxHeight
    drawW = boxHeight * imgAspect
    offsetX = (boxWidth - drawW) / 2
    offsetY = 0
  }

  const relX = localX - offsetX
  const relY = localY - offsetY
  if (relX < 0 || relY < 0 || relX >= drawW || relY >= drawH) return null

  const px = Math.min(imgW - 1, Math.max(0, Math.floor((relX / drawW) * imgW)))
  const py = Math.min(imgH - 1, Math.max(0, Math.floor((relY / drawH) * imgH)))

  const canvas = document.createElement('canvas')
  canvas.width = imgW
  canvas.height = imgH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(px, py, 1, 1)
  return rgbToHex(data[0]!, data[1]!, data[2]!)
}

/** Map document coords to unrotated image-local coords (top-left origin). */
export function docPointToImageLocal(
  node: ImageNode,
  docX: number,
  docY: number,
): { x: number; y: number } | null {
  const cx = node.x + node.width / 2
  const cy = node.y + node.height / 2
  const rad = (node.rotation * Math.PI) / 180
  const dx = docX - cx
  const dy = docY - cy
  const cos = Math.cos(-rad)
  const sin = Math.sin(-rad)
  const rx = dx * cos - dy * sin
  const ry = dx * sin + dy * cos
  const localX = rx + node.width / 2
  const localY = ry + node.height / 2
  if (localX < 0 || localY < 0 || localX > node.width || localY > node.height) return null
  return { x: localX, y: localY }
}

export async function resolveImageHref(
  sourceHref: string,
  chromaKey: ChromaKey | undefined,
): Promise<string> {
  if (!chromaKey?.enabled || chromaKey.entries.length === 0) return sourceHref
  return applyChromaKey(sourceHref, chromaKey.entries)
}
