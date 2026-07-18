import type { VectorDocument } from '../types'
import { documentToSvg } from './exportSvg'

export async function documentToPngBlob(doc: VectorDocument): Promise<Blob> {
  const svg = documentToSvg(doc)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = doc.artboard.width
    canvas.height = doc.artboard.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')
    if (doc.artboard.background) {
      ctx.fillStyle = doc.artboard.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0)
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('PNG export failed'))),
        'image/png',
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to rasterize SVG'))
    img.src = src
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
