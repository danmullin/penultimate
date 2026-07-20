import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { IconButton } from './Icon'
import { normalizeHex } from '../color/colorMath'
import { useDocStore } from '../store/documentStore'
import type { ChromaKey, ChromaKeyEntry, ImageNode } from '../types'

type Props = {
  node: ImageNode
}

const emptyChroma = (): ChromaKey => ({ enabled: false, entries: [] })

export function ImageChromaSection({ node }: Props) {
  const applyImageChromaKey = useDocStore((s) => s.applyImageChromaKey)
  const chromaColorPickId = useDocStore((s) => s.chromaColorPickId)
  const setChromaColorPickId = useDocStore((s) => s.setChromaColorPickId)
  const pushHistory = useDocStore((s) => s.pushHistory)
  const [busy, setBusy] = useState(false)

  const chroma = node.chromaKey ?? emptyChroma()
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
    const color = normalizeHex(raw)
    if (!color || chroma.entries.some((e) => e.color === color)) return
    void commit({
      enabled: true,
      entries: [...chroma.entries, { color, tolerance: 0 }],
      sourceHref: node.chromaKey?.sourceHref,
    })
  }

  const removeEntry = (color: string) => {
    pushHistory()
    const entries = chroma.entries.filter((e) => e.color !== color)
    void commit(
      {
        enabled: chroma.enabled && entries.length > 0,
        entries,
        sourceHref: node.chromaKey?.sourceHref,
      },
      false,
    )
  }

  const setTolerance = (color: string, tolerance: number) => {
    const entries = chroma.entries.map((e) =>
      e.color === color ? { ...e, tolerance: Math.max(0, Math.min(128, Math.round(tolerance))) } : e,
    )
    void commit(
      {
        ...chroma,
        entries,
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
          disabled={busy || chroma.entries.length === 0}
          onClick={toggleEnabled}
        />
        <span className="props-tool-label">Remove color</span>
      </div>

      <p className="props-hint props-hint--tight">
        Each swatch removes matching pixels. Raise tolerance to catch fringe shades.
      </p>

      <div className="chroma-colors">
        {chroma.entries.length > 0 && (
          <ul className="chroma-list">
            {chroma.entries.map((entry) => (
              <ChromaEntryRow
                key={entry.color}
                entry={entry}
                busy={busy}
                onRemove={() => removeEntry(entry.color)}
                onToleranceStart={() => pushHistory()}
                onToleranceChange={(tol) => setTolerance(entry.color, tol)}
              />
            ))}
          </ul>
        )}

        <div className="chroma-colors__actions">
          <ColorPicker
            value={chroma.entries[chroma.entries.length - 1]?.color ?? '#00ff00'}
            onChange={() => {}}
            onAdd={addColor}
            addLabel="Add"
            size="sm"
            aria-label="Add remove-color swatch"
          />
          <IconButton
            icon="tool-eyedropper"
            label={picking ? 'Stop picking colors from image' : 'Pick color from image'}
            active={picking}
            disabled={busy}
            onClick={togglePick}
          />
          {picking ? (
            <span className="chroma-colors__pick-hint">Eyedropper — click the image</span>
          ) : null}
        </div>
      </div>
    </>
  )
}

function ChromaEntryRow({
  entry,
  busy,
  onRemove,
  onToleranceStart,
  onToleranceChange,
}: {
  entry: ChromaKeyEntry
  busy: boolean
  onRemove: () => void
  onToleranceStart: () => void
  onToleranceChange: (tolerance: number) => void
}) {
  return (
    <li className="chroma-row">
      <button
        type="button"
        className="chroma-colors__chip"
        style={{ background: entry.color }}
        title={`${entry.color} — remove`}
        disabled={busy}
        onClick={onRemove}
      />
      <label className="chroma-row__tol field-inline">
        <span>Tolerance</span>
        <input
          type="range"
          min={0}
          max={128}
          step={1}
          value={entry.tolerance}
          disabled={busy}
          aria-label={`Tolerance for ${entry.color}`}
          onMouseDown={onToleranceStart}
          onChange={(e) => onToleranceChange(Number(e.target.value))}
        />
        <em className="field-inline__val">{entry.tolerance}</em>
      </label>
    </li>
  )
}
