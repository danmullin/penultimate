import { useRef, useState } from 'react'
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react'
import { useDocStore } from '../store/documentStore'
import { parentOf } from '../geometry'
import { IconButton } from './Icon'
import { PanelHeader } from './PanelHeader'
import type { VecNode } from '../types'

type DropPlace = 'before' | 'after'

type DragState = {
  id: string
  parentKey: string | null
  overId: string | null
  place: DropPlace
}

export function LayersPanel() {
  const doc = useDocStore((s) => s.doc)
  const selectedIds = useDocStore((s) => s.selectedIds)
  const select = useDocStore((s) => s.select)
  const reorderTo = useDocStore((s) => s.reorderTo)
  const toggleVisible = useDocStore((s) => s.toggleVisible)
  const toggleLocked = useDocStore((s) => s.toggleLocked)
  const renameNode = useDocStore((s) => s.renameNode)
  const deleteSelected = useDocStore((s) => s.deleteSelected)
  const [folded, setFolded] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<{
    id: string
    parentKey: string | null
    startY: number
    active: boolean
    pointerId: number
    overId: string | null
    place: DropPlace
  } | null>(null)
  const suppressClickRef = useRef(false)

  const ordered = [...doc.zOrder].reverse()

  const onRowPointerDown = (id: string, e: ReactPointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, input, a')) return
    dragRef.current = {
      id,
      parentKey: parentOf(id, doc),
      startY: e.clientY,
      active: false,
      pointerId: e.pointerId,
      overId: null,
      place: 'before',
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onRowPointerMove = (e: ReactPointerEvent) => {
    const pending = dragRef.current
    if (!pending || pending.pointerId !== e.pointerId) return

    if (!pending.active) {
      if (Math.abs(e.clientY - pending.startY) < 5) return
      pending.active = true
      select([pending.id], false)
      setDrag({
        id: pending.id,
        parentKey: pending.parentKey,
        overId: null,
        place: 'before',
      })
    }

    const el = document.elementFromPoint(e.clientX, e.clientY)
    const row = el?.closest('[data-layer-id]') as HTMLElement | null
    const overId = row?.dataset.layerId ?? null
    if (!overId || overId === pending.id || parentOf(overId, doc) !== pending.parentKey) {
      pending.overId = null
      setDrag({
        id: pending.id,
        parentKey: pending.parentKey,
        overId: null,
        place: 'before',
      })
      return
    }
    const rect = row!.getBoundingClientRect()
    const place: DropPlace = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    pending.overId = overId
    pending.place = place
    setDrag({
      id: pending.id,
      parentKey: pending.parentKey,
      overId,
      place,
    })
  }

  const onRowPointerUp = (e: ReactPointerEvent) => {
    const pending = dragRef.current
    if (!pending || pending.pointerId !== e.pointerId) return
    const wasDragging = pending.active
    const { id, overId, place } = pending
    dragRef.current = null
    setDrag(null)
    if (wasDragging) {
      suppressClickRef.current = true
      if (overId) reorderTo(id, overId, place)
    }
  }

  return (
    <aside className={`layers-panel${folded ? ' is-collapsed' : ''}`}>
      <PanelHeader
        title="Layers"
        collapsed={folded}
        onToggle={() => setFolded((v) => !v)}
      />
      {!folded && (
        <div className="layers-body">
          {ordered.length === 0 ? (
            <p className="panel-empty">No objects yet. Use a shape tool to draw.</p>
          ) : (
            <ul className={`layer-list${drag ? ' layer-list--dragging' : ''}`}>
              {ordered.map((id) => (
                <LayerRow
                  key={id}
                  id={id}
                  depth={0}
                  docNodes={doc.nodes}
                  selectedIds={selectedIds}
                  collapsed={collapsed}
                  setCollapsed={setCollapsed}
                  select={select}
                  toggleVisible={toggleVisible}
                  toggleLocked={toggleLocked}
                  renameNode={renameNode}
                  deleteSelected={deleteSelected}
                  drag={drag}
                  suppressClickRef={suppressClickRef}
                  onRowPointerDown={onRowPointerDown}
                  onRowPointerMove={onRowPointerMove}
                  onRowPointerUp={onRowPointerUp}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  )
}

function LayerRow({
  id,
  depth,
  docNodes,
  selectedIds,
  collapsed,
  setCollapsed,
  select,
  toggleVisible,
  toggleLocked,
  renameNode,
  deleteSelected,
  drag,
  suppressClickRef,
  onRowPointerDown,
  onRowPointerMove,
  onRowPointerUp,
}: {
  id: string
  depth: number
  docNodes: Record<string, VecNode>
  selectedIds: string[]
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  select: (ids: string[], additive?: boolean) => void
  toggleVisible: (id: string) => void
  toggleLocked: (id: string) => void
  renameNode: (id: string, name: string) => void
  deleteSelected: () => void
  drag: DragState | null
  suppressClickRef: { current: boolean }
  onRowPointerDown: (id: string, e: ReactPointerEvent) => void
  onRowPointerMove: (e: ReactPointerEvent) => void
  onRowPointerUp: (e: ReactPointerEvent) => void
}) {
  const node = docNodes[id]
  if (!node) return null
  const selected = selectedIds.includes(id)
  const isGroup = node.type === 'group'
  const isOpen = isGroup && !collapsed[id]
  const childIds = isGroup ? [...node.children].reverse() : []
  const dragging = drag?.id === id
  const dropBefore = drag?.overId === id && drag.place === 'before'
  const dropAfter = drag?.overId === id && drag.place === 'after'

  return (
    <>
      <li
        data-layer-id={id}
        className={[
          'layer-row',
          `layer-row--${node.type}`,
          node.type === 'rect' && (node.rx ?? 0) > 0 ? 'layer-row--round' : '',
          selected ? 'layer-row--selected' : '',
          !node.visible ? 'layer-row--hidden' : '',
          node.locked ? 'layer-row--locked' : '',
          node.type === 'group' && node.clipped ? 'layer-row--clip' : '',
          dragging ? 'layer-row--dragging' : '',
          dropBefore ? 'layer-row--drop-before' : '',
          dropAfter ? 'layer-row--drop-after' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ['--layer-depth' as string]: String(depth) }}
        onClick={(e) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
          }
          select([id], e.shiftKey)
        }}
        onPointerDown={(e) => onRowPointerDown(id, e)}
        onPointerMove={onRowPointerMove}
        onPointerUp={onRowPointerUp}
        onPointerCancel={onRowPointerUp}
      >
        <div className="layer-row__main">
          {isGroup ? (
            <button
              type="button"
              className="layer-twist"
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed((c) => ({ ...c, [id]: !c[id] }))
              }}
            >
              {isOpen ? '▾' : '▸'}
            </button>
          ) : (
            <span className="layer-twist layer-twist--spacer" />
          )}
          <span className="layer-glyph" aria-hidden="true" />
          <IconButton
            icon={node.visible ? 'visible' : 'hidden'}
            label={node.visible ? 'Hide' : 'Show'}
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation()
              toggleVisible(id)
            }}
          />
          <IconButton
            icon={node.locked ? 'locked' : 'unlocked'}
            label={node.locked ? 'Unlock' : 'Lock'}
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation()
              toggleLocked(id)
            }}
          />
          <span className="layer-type" title={node.type}>
            {shortType(node)}
            {node.type === 'group' && node.clipped ? ' ✂' : ''}
          </span>
          <input
            className="layer-name"
            defaultValue={node.name}
            key={`${id}-${node.name}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const next = e.target.value.trim() || node.name
              if (next !== node.name) renameNode(id, next)
            }}
          />
          <IconButton
            icon="delete"
            label="Delete"
            danger
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation()
              select([id])
              deleteSelected()
            }}
          />
        </div>
      </li>
      {isOpen &&
        childIds.map((cid) => (
          <LayerRow
            key={cid}
            id={cid}
            depth={depth + 1}
            docNodes={docNodes}
            selectedIds={selectedIds}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            select={select}
            toggleVisible={toggleVisible}
            toggleLocked={toggleLocked}
            renameNode={renameNode}
            deleteSelected={deleteSelected}
            drag={drag}
            suppressClickRef={suppressClickRef}
            onRowPointerDown={onRowPointerDown}
            onRowPointerMove={onRowPointerMove}
            onRowPointerUp={onRowPointerUp}
          />
        ))}
    </>
  )
}

function shortType(node: VecNode): string {
  if (node.type === 'rect' && (node.rx ?? 0) > 0) return 'round'
  switch (node.type) {
    case 'ellipse':
      return 'oval'
    case 'image':
      return 'img'
    default:
      return node.type
  }
}
