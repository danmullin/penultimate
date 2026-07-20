import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { IconButton } from './Icon'
import { normalizeHex } from '../color/colorMath'
import { useDocStore } from '../store/documentStore'
import type { ChromaKey, ImageNode } from '../types'

type Props = {
  node: ImageNode
}

export function ImageChromaSection({ node }: Props) {
  const applyImageChromaKey = useDocStore((s) => s.applyImageChromaKey)
  const chromaColorPickId = useDocStore((s) => s.chromaColorPickId)
  const setChromaColorPickId = useDocStore((s) => s.setChromaColorPickId)
  const pushHistory = useDocStore((s) => s.pushHistory)
  const [busy, setBusy] = useState(false)

  const chroma = node.chromaKey ?? { enabled: false, colors: [] }
  const picking = chromaColorPickId === node.id

  const commit = async (next: ChromaKey, recordHistory = true) => {
    setBusy(true)
    try {
      await applyImageChromaKey(
        node.id,
        {
          ...next,
          sourceHref: next.sourceHref ?? node.chromaKey?.sourceHref ?? node.href,
        },
        recordHistory,
      )
    } finally {
      setBusy(false)
    }
  }

  const addColor = (raw: string) => {
    const hex = normalizeHex(raw)
    if (!hex || chroma.colors.includes(hex)) return
    void commit({
      enabled: true,
      colors: [...chroma.colors, hex],
      sourceHref: node.chromaKey?.sourceHref,
    })
  }

  const removeColor = (hex: string) => {
    pushHistory()
    const colors = chroma.colors.filter((c) => c !== hex)
    void commit(
      {
        enabled: chroma.enabled && colors.length > 0,
        colors,
        sourceHref: node.chromaKey?.sourceHref,
      },
      false,
    )
  }

  const toggleEnabled = () => {
    void commit({
      ...chroma,
      enabled: !chroma.enabled,
      sourceHref: node.chromaKey?.sourceHref,
    })
  }

  const togglePick = () => {
    setChromaColorPickId(picking ? null : node.id)
  }

  return (
    <>
      <div className="props-tool-row props-tool-row--shadow">
        <IconButton
          icon="effect-blur"
          label="Toggle remove color"
          active={chroma.enabled}
          disabled={busy || chroma.colors.length === 0}
          onClick={toggleEnabled}
        />
        <span className="props-tool-label">Remove color</span>
      </div>

      <p className="props-hint props-hint--tight">
        Exact hex matches become transparent. Add fringe greens as separate swatches.
      </p>

      <div className="chroma-colors">
        <div className="chroma-colors__grid">
          {chroma.colors.map((c) => (
            <button
              key={c}
              type="button"
              className="chroma-colors__chip"
              style={{ background: c }}
              title={`${c} — click to remove`}
              disabled={busy}
              onClick={() => removeColor(c)}
            />
          ))}
          <ColorPicker
            value={chroma.colors[chroma.colors.length - 1] ?? '#00ff00'}
            onChange={() => {}}
            onAdd={addColor}
            addLabel="Add"
            size="sm"
            aria-label="Add remove-color swatch"
          />
        </div>
        <div className="chroma-colors__actions">
          <IconButton
            icon="tool-eyedropper"
            label={picking ? 'Stop picking colors from image' : 'Pick color from image'}
            active={picking}
            disabled={busy}
            onClick={togglePick}
          />
          {picking ? (
            <span className="chroma-colors__pick-hint">Click the image or selection box</span>
          ) : null}
        </div>
      </div>
    </>
  )
}
