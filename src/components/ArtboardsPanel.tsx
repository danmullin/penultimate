import { useState } from 'react'
import { Icon, IconButton } from './Icon'
import { PanelHeader } from './PanelHeader'
import { useDocStore } from '../store/documentStore'
import type { ArtboardFrame } from '../types'

export function ArtboardsPanel() {
  const artboards = useDocStore((s) => s.doc.artboards)
  const activeArtboardId = useDocStore((s) => s.doc.activeArtboardId)
  const setActiveArtboard = useDocStore((s) => s.setActiveArtboard)
  const addArtboard = useDocStore((s) => s.addArtboard)
  const removeArtboard = useDocStore((s) => s.removeArtboard)
  const renameArtboard = useDocStore((s) => s.renameArtboard)
  const clearArtboard = useDocStore((s) => s.clearArtboard)
  const nodeCount = useDocStore((s) => Object.keys(s.doc.nodes).length)
  const [folded, setFolded] = useState(false)

  return (
    <aside className={`artboards-panel${folded ? ' is-collapsed' : ''}`}>
      <PanelHeader
        title={`Artboards (${artboards.length})`}
        collapsed={folded}
        onToggle={() => setFolded((v) => !v)}
      />
      {!folded && (
        <div className="artboards-body">
          <div className="artboards-toolbar">
            <IconButton icon="artboards" label="Add artboard" onClick={() => addArtboard()} />
            <IconButton
              icon="clear-artboard"
              label="Clear active artboard"
              disabled={nodeCount === 0}
              danger
              onClick={() => clearArtboard(activeArtboardId)}
            />
          </div>
          <ul className="layer-list artboard-list">
            {artboards.map((ab) => (
              <ArtboardRow
                key={ab.id}
                artboard={ab}
                active={ab.id === activeArtboardId}
                canDelete={artboards.length > 1}
                onSelect={() => setActiveArtboard(ab.id)}
                onRename={(name) => renameArtboard(ab.id, name)}
                onClear={() => clearArtboard(ab.id)}
                onDelete={() => removeArtboard(ab.id)}
                clearDisabled={nodeCount === 0}
              />
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function ArtboardRow({
  artboard,
  active,
  canDelete,
  clearDisabled,
  onSelect,
  onRename,
  onClear,
  onDelete,
}: {
  artboard: ArtboardFrame
  active: boolean
  canDelete: boolean
  clearDisabled: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onClear: () => void
  onDelete: () => void
}) {
  return (
    <li
      className={`layer-row artboard-row${active ? ' layer-row--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="layer-row__main">
        <span className="artboard-row__icon" aria-hidden>
          <Icon name="tool-artboard" />
        </span>
        <input
          className="layer-name"
          defaultValue={artboard.name}
          key={`${artboard.id}-${artboard.name}`}
          aria-label="Artboard name"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onFocus={() => onSelect()}
          onBlur={(e) => {
            const next = e.target.value.trim() || artboard.name
            if (next !== artboard.name) onRename(next)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        <span className="artboard-row__size" title="Artboard size">
          {Math.round(artboard.width)}×{Math.round(artboard.height)}
        </span>
        <IconButton
          icon="clear-artboard"
          label="Clear artboard"
          className="icon-btn"
          disabled={clearDisabled}
          danger
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
            onClear()
          }}
        />
        <IconButton
          icon="delete"
          label="Delete artboard"
          className="icon-btn"
          disabled={!canDelete}
          danger
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        />
      </div>
    </li>
  )
}
