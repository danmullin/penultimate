import { useEffect, useState } from 'react'
import { paintCssPreview, paintNone } from '../style/paint'
import { pathfinderTargetIds } from '../ops/paperUtils'
import { useColorPickerSession } from '../hooks/useColorPickerSession'
import { useDocStore } from '../store/documentStore'
import { ColorPicker } from './ColorPicker'
import { Icon, IconButton } from './Icon'
import { useTooltip } from './Tooltip'
import { defaultStyle, defaultTextStyle, type Tool } from '../types'

const TOOL_LABELS: Record<Tool, string> = {
  select: 'Selection',
  direct: 'Direct Selection',
  rect: 'Rectangle',
  'rounded-rect': 'Rounded Rectangle',
  ellipse: 'Ellipse',
  polygon: 'Polygon',
  star: 'Star',
  line: 'Line',
  pen: 'Pen',
  pencil: 'Pencil',
  eyedropper: 'Eyedropper',
  text: 'Type',
  'area-text': 'Area Type',
  scissors: 'Scissors',
  shear: 'Shear',
  zoom: 'Zoom',
}

export function ControlBar() {
  const doc = useDocStore((s) => s.doc)
  const tool = useDocStore((s) => s.tool)
  const selectedIds = useDocStore((s) => s.selectedIds)
  const setArtboardSize = useDocStore((s) => s.setArtboardSize)
  const setArtboardBackground = useDocStore((s) => s.setArtboardBackground)
  const bgColorSession = useColorPickerSession()
  const setSettings = useDocStore((s) => s.setSettings)
  const align = useDocStore((s) => s.align)
  const distribute = useDocStore((s) => s.distribute)
  const group = useDocStore((s) => s.group)
  const ungroup = useDocStore((s) => s.ungroup)
  const finishPen = useDocStore((s) => s.finishPen)
  const cancelPen = useDocStore((s) => s.cancelPen)
  const applyStyleToSelected = useDocStore((s) => s.applyStyleToSelected)
  const pathfinderSelected = useDocStore((s) => s.pathfinderSelected)
  const joinSelectedPaths = useDocStore((s) => s.joinSelectedPaths)
  const outlineStrokeSelected = useDocStore((s) => s.outlineStrokeSelected)
  const offsetPathSelected = useDocStore((s) => s.offsetPathSelected)
  const shearSelected = useDocStore((s) => s.shearSelected)
  const clearManualGuides = useDocStore((s) => s.clearManualGuides)
  const showRulers = useDocStore((s) => s.showRulers)
  const setShowRulers = useDocStore((s) => s.setShowRulers)
  const reorderExtreme = useDocStore((s) => s.reorderExtreme)
  const duplicateSelected = useDocStore((s) => s.duplicateSelected)
  const reflectSelected = useDocStore((s) => s.reflectSelected)
  const makeClipMask = useDocStore((s) => s.makeClipMask)
  const releaseClipMask = useDocStore((s) => s.releaseClipMask)
  const outlineMode = useDocStore((s) => s.outlineMode)
  const setOutlineMode = useDocStore((s) => s.setOutlineMode)
  const aspectLock = useDocStore((s) => s.aspectLock)
  const setAspectLock = useDocStore((s) => s.setAspectLock)
  const addArtboard = useDocStore((s) => s.addArtboard)
  const removeActiveArtboard = useDocStore((s) => s.removeActiveArtboard)
  const setActiveArtboard = useDocStore((s) => s.setActiveArtboard)
  const zoom = useDocStore((s) => s.zoom)
  const zoomBy = useDocStore((s) => s.zoomBy)
  const requestFitZoom = useDocStore((s) => s.requestFitZoom)
  const zoomTo100 = useDocStore((s) => s.zoomTo100)
  const [alignToArtboard, setAlignToArtboard] = useState(false)
  const fillStrokeTip = useTooltip('Fill / Stroke — edit in Appearance panel')
  const snapTip = useTooltip('Snap to grid')
  const guidesTip = useTooltip('Smart guides')
  const zoomOutTip = useTooltip('Zoom out (Ctrl+-)')
  const zoomInTip = useTooltip('Zoom in (Ctrl+=)')
  const zoomFitTip = useTooltip('Fit artboard (Ctrl+0)')
  const zoomPctTip = useTooltip('Click for 100% (Ctrl+1)')

  const [wDraft, setWDraft] = useState(String(doc.artboard.width))
  const [hDraft, setHDraft] = useState(String(doc.artboard.height))

  useEffect(() => {
    setWDraft(String(doc.artboard.width))
    setHDraft(String(doc.artboard.height))
  }, [doc.artboard.width, doc.artboard.height])

  const primary = selectedIds.length ? doc.nodes[selectedIds[0]] : null
  // When nothing is selected, still preview what the active create tool will mint.
  const previewStyle = (() => {
    if (primary) return primary.style
    if (tool === 'text' || tool === 'area-text') return defaultTextStyle()
    if (tool === 'line' || tool === 'pen' || tool === 'pencil') {
      return { ...defaultStyle(), fill: paintNone() }
    }
    if (
      tool === 'rect' ||
      tool === 'rounded-rect' ||
      tool === 'ellipse' ||
      tool === 'polygon' ||
      tool === 'star'
    ) {
      return defaultStyle()
    }
    return null
  })()
  const canPathfinder = pathfinderTargetIds(doc, selectedIds).length >= 2
  const toolIcon =
    tool === 'text'
      ? 'tool-text'
      : tool === 'area-text'
        ? 'tool-area-text'
        : tool === 'rounded-rect'
          ? 'tool-rounded-rect'
          : tool === 'eyedropper'
            ? 'tool-eyedropper'
            : tool === 'scissors'
              ? 'tool-scissors'
              : tool === 'shear'
                ? 'tool-shear'
                : tool === 'zoom'
                  ? 'tool-zoom'
                  : `tool-${tool}`

  return (
    <div className="control-bar">
      <div className="control-bar__tool">
        <Icon name={toolIcon} />
        <span>{TOOL_LABELS[tool]}</span>
      </div>
      <div className="control-bar__sep" />

      <div className="control-bar__appearance" aria-hidden={!previewStyle}>
        <div
          className={`swatch-stack${!primary ? ' swatch-stack--empty' : ''}`}
          {...fillStrokeTip}
        >
          <span
            className={`swatch swatch--fill${
              previewStyle?.fill.type === 'none' ? ' swatch--none' : ''
            }`}
            style={
              previewStyle && previewStyle.fill.type !== 'none'
                ? { background: paintCssPreview(previewStyle.fill) }
                : undefined
            }
            aria-label="Fill"
          />
          <span
            className={`swatch swatch--stroke${
              previewStyle?.stroke.type === 'none' ? ' swatch--none' : ''
            }`}
            style={
              previewStyle && previewStyle.stroke.type !== 'none'
                ? { background: paintCssPreview(previewStyle.stroke) }
                : undefined
            }
            aria-label="Stroke"
          />
        </div>
        <label className="field control-field">
          <span className="control-field__label">Stroke</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={previewStyle?.strokeWidth ?? 0}
            disabled={!primary || primary.style.stroke.type === 'none'}
            onChange={(e) =>
              applyStyleToSelected({
                strokeWidth: Math.max(0, Number(e.target.value) || 0),
              })
            }
          />
        </label>
      </div>
      <div className="control-bar__sep" />

      <div className="control-bar__group">
        <IconButton
          icon="group"
          label="Group"
          disabled={selectedIds.length < 2}
          onClick={() => group()}
        />
        <IconButton
          icon="ungroup"
          label="Ungroup"
          disabled={selectedIds.length === 0}
          onClick={() => ungroup()}
        />
        <IconButton
          icon="duplicate"
          label="Duplicate"
          disabled={selectedIds.length === 0}
          onClick={() => duplicateSelected()}
        />
        <IconButton
          icon="bring-front"
          label="Bring to front"
          disabled={selectedIds.length === 0}
          onClick={() => reorderExtreme('front')}
        />
        <IconButton
          icon="send-back"
          label="Send to back"
          disabled={selectedIds.length === 0}
          onClick={() => reorderExtreme('back')}
        />
        <IconButton
          icon="reflect-h"
          label="Reflect horizontal"
          disabled={selectedIds.length === 0}
          onClick={() => reflectSelected('horizontal')}
        />
        <IconButton
          icon="reflect-v"
          label="Reflect vertical"
          disabled={selectedIds.length === 0}
          onClick={() => reflectSelected('vertical')}
        />
        <IconButton
          icon="tool-shear"
          label="Shear horizontal"
          disabled={selectedIds.length === 0}
          onClick={() => shearSelected('x', 0.25)}
        />
        <IconButton
          icon="tool-shear"
          label="Shear vertical"
          disabled={selectedIds.length === 0}
          onClick={() => shearSelected('y', 0.25)}
        />
        <IconButton
          icon="tool-join"
          label="Join paths"
          disabled={selectedIds.length < 2}
          onClick={() => joinSelectedPaths()}
        />
        <IconButton
          icon="outline-stroke"
          label="Outline stroke"
          disabled={selectedIds.length === 0}
          onClick={() => outlineStrokeSelected()}
        />
        <IconButton
          icon="offset-path"
          label="Offset path +10"
          disabled={selectedIds.length === 0}
          onClick={() => offsetPathSelected(10)}
        />
        <IconButton
          icon="clip-mask"
          label="Make clipping mask"
          disabled={selectedIds.length < 2}
          onClick={() => makeClipMask()}
        />
        <IconButton
          icon="ungroup"
          label="Release clipping mask"
          disabled={
            !selectedIds.some((id) => {
              const n = doc.nodes[id]
              return n?.type === 'group' && n.clipped
            })
          }
          onClick={() => releaseClipMask()}
        />
        <IconButton
          icon={aspectLock ? 'aspect-lock' : 'aspect-unlock'}
          label={aspectLock ? 'Aspect lock on' : 'Aspect lock off'}
          active={aspectLock}
          onClick={() => setAspectLock(!aspectLock)}
        />
        <IconButton
          icon="outline-mode"
          label={outlineMode ? 'Outline mode on' : 'Outline mode off'}
          active={outlineMode}
          onClick={() => setOutlineMode(!outlineMode)}
        />
      </div>
      <div className="control-bar__sep" />

      <div className="control-bar__group" aria-label="Pathfinder">
        <IconButton
          icon="pathfinder-unite"
          label={canPathfinder ? 'Unite' : 'Unite (select 2+ shapes)'}
          disabled={!canPathfinder}
          onClick={() => pathfinderSelected('unite')}
        />
        <IconButton
          icon="pathfinder-subtract"
          label={canPathfinder ? 'Subtract' : 'Subtract (select 2+ shapes)'}
          disabled={!canPathfinder}
          onClick={() => pathfinderSelected('subtract')}
        />
        <IconButton
          icon="pathfinder-intersect"
          label={canPathfinder ? 'Intersect' : 'Intersect (select 2+ shapes)'}
          disabled={!canPathfinder}
          onClick={() => pathfinderSelected('intersect')}
        />
        <IconButton
          icon="pathfinder-exclude"
          label={canPathfinder ? 'Exclude' : 'Exclude (select 2+ shapes)'}
          disabled={!canPathfinder}
          onClick={() => pathfinderSelected('exclude')}
        />
        <IconButton
          icon="pathfinder-divide"
          label={canPathfinder ? 'Divide' : 'Divide (select 2+ shapes)'}
          disabled={!canPathfinder}
          onClick={() => pathfinderSelected('divide')}
        />
        <IconButton
          icon="pathfinder-trim"
          label={canPathfinder ? 'Trim' : 'Trim (select 2+ shapes)'}
          disabled={!canPathfinder}
          onClick={() => pathfinderSelected('trim')}
        />
      </div>
      <div className="control-bar__sep" />

      <div className="control-bar__group" aria-label="View">
        <IconButton
          icon="rulers"
          label={showRulers ? 'Hide rulers' : 'Show rulers'}
          active={showRulers}
          onClick={() => setShowRulers(!showRulers)}
        />
        <IconButton
          icon="guides"
          label="Clear manual guides"
          disabled={doc.manualGuides.length === 0}
          onClick={() => clearManualGuides()}
        />
      </div>
      <div className="control-bar__sep" />

      <div className="control-bar__group" aria-label="Align">
        <IconButton
          icon="align-artboard"
          label={alignToArtboard ? 'Align to artboard (on)' : 'Align to artboard (off)'}
          active={alignToArtboard}
          onClick={() => setAlignToArtboard((v) => !v)}
        />
        <IconButton
          icon="align-left"
          label="Align left"
          disabled={!selectedIds.length}
          onClick={() => align('left', alignToArtboard)}
        />
        <IconButton
          icon="align-h-center"
          label="Align horizontal center"
          disabled={!selectedIds.length}
          onClick={() => align('center', alignToArtboard)}
        />
        <IconButton
          icon="align-right"
          label="Align right"
          disabled={!selectedIds.length}
          onClick={() => align('right', alignToArtboard)}
        />
        <IconButton
          icon="align-top"
          label="Align top"
          disabled={!selectedIds.length}
          onClick={() => align('top', alignToArtboard)}
        />
        <IconButton
          icon="align-v-center"
          label="Align vertical center"
          disabled={!selectedIds.length}
          onClick={() => align('middle', alignToArtboard)}
        />
        <IconButton
          icon="align-bottom"
          label="Align bottom"
          disabled={!selectedIds.length}
          onClick={() => align('bottom', alignToArtboard)}
        />
        <IconButton
          icon="dist-h"
          label="Distribute horizontally"
          disabled={selectedIds.length < 3}
          onClick={() => distribute('horizontal')}
        />
        <IconButton
          icon="dist-v"
          label="Distribute vertically"
          disabled={selectedIds.length < 3}
          onClick={() => distribute('vertical')}
        />
      </div>

      <div className="control-bar__sep" />

      <div className="control-bar__group">
        <label className="field control-field">
          Artboard
          <select
            value={doc.activeArtboardId}
            onChange={(e) => setActiveArtboard(e.target.value)}
            aria-label="Active artboard"
          >
            {doc.artboards.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <IconButton icon="artboards" label="Add artboard" onClick={() => addArtboard()} />
        <IconButton
          icon="delete"
          label="Remove artboard"
          disabled={doc.artboards.length <= 1}
          onClick={() => removeActiveArtboard()}
        />
        <label className="field control-field">
          Artboard W
          <input
            type="number"
            value={wDraft}
            onChange={(e) => setWDraft(e.target.value)}
            onBlur={() => {
              const w = Number(wDraft)
              const h = Number(hDraft)
              if (Number.isFinite(w) && Number.isFinite(h)) setArtboardSize(w, h)
            }}
          />
        </label>
        <label className="field control-field">
          H
          <input
            type="number"
            value={hDraft}
            onChange={(e) => setHDraft(e.target.value)}
            onBlur={() => {
              const w = Number(wDraft)
              const h = Number(hDraft)
              if (Number.isFinite(w) && Number.isFinite(h)) setArtboardSize(w, h)
            }}
          />
        </label>
        <label className="field control-field control-field--color">
          BG
          <ColorPicker
            value={doc.artboard.background ?? '#ffffff'}
            size="sm"
            aria-label="Artboard background"
            onOpen={() => bgColorSession.commit()}
            onChange={(hex) => setArtboardBackground(hex, bgColorSession.beginChange())}
            onCancel={() => bgColorSession.cancel()}
            onCommit={() => bgColorSession.commit()}
          />
        </label>
        <label className="check check--icon" {...snapTip}>
          <input
            type="checkbox"
            checked={doc.settings.snapToGrid}
            onChange={(e) => setSettings({ snapToGrid: e.target.checked })}
            aria-label="Snap to grid"
          />
          <Icon name="snap" />
        </label>
        <label className="check check--icon" {...guidesTip}>
          <input
            type="checkbox"
            checked={doc.settings.snapToNeighbors}
            onChange={(e) => setSettings({ snapToNeighbors: e.target.checked })}
            aria-label="Smart guides"
          />
          <Icon name="guides" />
        </label>
        <div className="zoom-controls" role="group" aria-label="Zoom">
          <button
            type="button"
            className="ghost-btn zoom-controls__btn"
            aria-label="Zoom out"
            onClick={() => zoomBy(1 / 1.25)}
            {...zoomOutTip}
          >
            −
          </button>
          <button
            type="button"
            className="ghost-btn zoom-controls__pct"
            aria-label={`Zoom ${Math.round(zoom * 100)} percent — click for 100%`}
            onClick={() => zoomTo100()}
            {...zoomPctTip}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="ghost-btn zoom-controls__btn"
            aria-label="Zoom in"
            onClick={() => zoomBy(1.25)}
            {...zoomInTip}
          >
            +
          </button>
          <button
            type="button"
            className="ghost-btn zoom-controls__fit"
            aria-label="Fit artboard"
            onClick={() => requestFitZoom()}
            {...zoomFitTip}
          >
            Fit
          </button>
        </div>
      </div>

      {tool === 'pen' && (
        <>
          <div className="control-bar__sep" />
          <div className="control-bar__group">
            <IconButton icon="check" label="Finish path" primary onClick={() => finishPen()} />
            <IconButton icon="cancel" label="Cancel path" onClick={() => cancelPen()} />
          </div>
        </>
      )}
    </div>
  )
}
