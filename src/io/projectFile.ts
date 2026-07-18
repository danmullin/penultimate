import {
  createArtboardFrame,
  createEmptyDocument,
  normalizeNode,
  syncArtboardFromActive,
  type ArtboardFrame,
  type VecNode,
  type VectorDocument,
} from '../types'
import { downloadText } from './exportSvg'

function isNode(value: unknown): value is VecNode {
  if (!value || typeof value !== 'object') return false
  const n = value as Record<string, unknown>
  return typeof n.id === 'string' && typeof n.type === 'string'
}

function normalizeArtboards(
  raw: Partial<VectorDocument>,
  base: VectorDocument,
): { artboards: ArtboardFrame[]; activeArtboardId: string } {
  if (Array.isArray(raw.artboards) && raw.artboards.length > 0) {
    const artboards = raw.artboards
      .filter((a): a is ArtboardFrame => Boolean(a && typeof a === 'object' && typeof a.id === 'string'))
      .map((a, i) =>
        createArtboardFrame({
          id: a.id,
          name: typeof a.name === 'string' ? a.name : `Artboard ${i + 1}`,
          x: Number(a.x) || 0,
          y: Number(a.y) || 0,
          width: Math.max(1, Math.round(Number(a.width) || base.artboard.width)),
          height: Math.max(1, Math.round(Number(a.height) || base.artboard.height)),
          background: a.background === undefined ? '#ffffff' : a.background,
        }),
      )
    if (artboards.length) {
      const activeArtboardId =
        typeof raw.activeArtboardId === 'string' &&
        artboards.some((a) => a.id === raw.activeArtboardId)
          ? raw.activeArtboardId
          : artboards[0].id
      return { artboards, activeArtboardId }
    }
  }

  const frame = createArtboardFrame({
    width: Math.max(1, Math.round(raw.artboard?.width ?? base.artboard.width)),
    height: Math.max(1, Math.round(raw.artboard?.height ?? base.artboard.height)),
    background:
      raw.artboard?.background === undefined
        ? base.artboard.background
        : raw.artboard.background,
  })
  return { artboards: [frame], activeArtboardId: frame.id }
}

export function parseProjectJson(text: string): VectorDocument {
  const raw = JSON.parse(text) as Partial<VectorDocument>
  const base = createEmptyDocument()
  if (!raw || typeof raw !== 'object') throw new Error('Invalid project')

  const nodes: Record<string, VecNode> = {}
  if (raw.nodes && typeof raw.nodes === 'object') {
    for (const [id, node] of Object.entries(raw.nodes)) {
      if (isNode(node)) nodes[id] = normalizeNode(node)
    }
  }

  const zOrder = Array.isArray(raw.zOrder)
    ? raw.zOrder.filter((id): id is string => typeof id === 'string' && Boolean(nodes[id]))
    : Object.keys(nodes)

  const { artboards, activeArtboardId } = normalizeArtboards(raw, base)
  const swatches = Array.isArray(raw.swatches)
    ? raw.swatches.filter((c): c is string => typeof c === 'string')
    : base.swatches

  const doc = syncArtboardFromActive({
    version: 1,
    name: typeof raw.name === 'string' ? raw.name : base.name,
    artboard: {
      width: artboards[0].width,
      height: artboards[0].height,
      background: artboards[0].background,
    },
    artboards,
    activeArtboardId,
    settings: {
      gridSize: raw.settings?.gridSize ?? base.settings.gridSize,
      showGrid: raw.settings?.showGrid ?? base.settings.showGrid,
      snapToGrid: raw.settings?.snapToGrid ?? base.settings.snapToGrid,
      snapToNeighbors: raw.settings?.snapToNeighbors ?? base.settings.snapToNeighbors,
      snapThreshold: raw.settings?.snapThreshold ?? base.settings.snapThreshold,
    },
    nodes,
    zOrder,
    swatches,
    manualGuides: Array.isArray(raw.manualGuides)
      ? raw.manualGuides.filter(
          (g): g is { orientation: 'vertical' | 'horizontal'; position: number } =>
            !!g &&
            typeof g === 'object' &&
            ((g as { orientation?: string }).orientation === 'vertical' ||
              (g as { orientation?: string }).orientation === 'horizontal') &&
            typeof (g as { position?: unknown }).position === 'number',
        )
      : [],
  })

  return doc
}

export async function saveProject(doc: VectorDocument): Promise<void> {
  const json = JSON.stringify(doc, null, 2)
  const anyWindow = window as Window & {
    showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle>
  }
  const suggested = `${(doc.name || 'untitled').replace(/[^\w\-]+/g, '_')}.vector.json`

  if (!anyWindow.showSaveFilePicker) {
    downloadText(json, suggested, 'application/json')
    return
  }

  try {
    const handle = await anyWindow.showSaveFilePicker({
      suggestedName: suggested,
      types: [
        {
          description: 'Vector Project',
          accept: { 'application/json': ['.json', '.vector.json'] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(json)
    await writable.close()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    downloadText(json, suggested, 'application/json')
  }
}

export async function openProject(): Promise<VectorDocument | null> {
  const anyWindow = window as Window & {
    showOpenFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle[]>
  }

  if (anyWindow.showOpenFilePicker) {
    try {
      const [handle] = await anyWindow.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Vector Project',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const file = await handle.getFile()
      return parseProjectJson(await file.text())
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.vector.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      void file.text().then((t) => resolve(parseProjectJson(t)))
    }
    input.click()
  })
}

export async function openRasterFile(): Promise<{ href: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const href = String(reader.result || '')
        const img = new Image()
        img.onload = () => {
          resolve({ href, width: img.naturalWidth || 200, height: img.naturalHeight || 200 })
        }
        img.onerror = () => resolve(null)
        img.src = href
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    }
    input.click()
  })
}
