import {
  defaultLinearPaint,
  defaultRadialPaint,
  paintCssPreview,
  paintNone,
  paintSolid,
  type Paint,
} from '../style/paint'
import { useColorPickerSession } from '../hooks/useColorPickerSession'
import { ColorPicker } from './ColorPicker'
import { IconButton } from './Icon'

type Props = {
  label: string
  paint: Paint
  onChange: (paint: Paint, recordHistory?: boolean) => void
  allowNone?: boolean
}

export function PaintControl({ label, paint, onChange, allowNone = true }: Props) {
  const mode = paint.type
  const solidColor = paint.type === 'solid' ? paint.color : '#ffffff'
  const stops =
    paint.type === 'linear' || paint.type === 'radial'
      ? paint.stops
      : [
          { offset: 0, color: '#ffffff' },
          { offset: 1, color: '#000000' },
        ]

  const setMode = (next: Paint['type']) => {
    if (next === 'none') onChange(paintNone())
    else if (next === 'solid') {
      const prev =
        paint.type === 'solid'
          ? paint.color
          : paint.type === 'linear' || paint.type === 'radial'
            ? paint.stops[0]?.color ?? '#ffffff'
            : '#ffffff'
      onChange(paintSolid(prev))
    } else if (next === 'linear') {
      if (paint.type === 'linear') return
      const from =
        paint.type === 'solid'
          ? paint.color
          : paint.type === 'radial'
            ? paint.stops[0].color
            : '#ffffff'
      const to =
        paint.type === 'radial' ? paint.stops[paint.stops.length - 1].color : '#000000'
      onChange(defaultLinearPaint(from, to))
    } else if (next === 'radial') {
      if (paint.type === 'radial') return
      const from =
        paint.type === 'solid'
          ? paint.color
          : paint.type === 'linear'
            ? paint.stops[0].color
            : '#ffffff'
      const to =
        paint.type === 'linear' ? paint.stops[paint.stops.length - 1].color : '#000000'
      onChange(defaultRadialPaint(from, to))
    }
  }

  const updateStop = (
    index: number,
    patch: Partial<{ offset: number; color: string }>,
    recordHistory = true,
  ) => {
    if (paint.type !== 'linear' && paint.type !== 'radial') return
    const nextStops = paint.stops.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange({ ...paint, stops: nextStops }, recordHistory)
  }

  return (
    <div className="paint-control paint-control--compact">
      <div className="paint-control__row">
        <span className="paint-control__label">{label}</span>
        {mode !== 'solid' && (
          <div
            className="paint-swatch"
            title={mode}
            style={{
              background:
                mode === 'none'
                  ? 'repeating-conic-gradient(#94a3b8 0% 25%, #e2e8f0 0% 50%) 0 0 / 8px 8px'
                  : paintCssPreview(paint),
            }}
          />
        )}
        <div className="paint-modes">
          {allowNone && (
            <IconButton
              icon="paint-none"
              label="No paint"
              active={mode === 'none'}
              onClick={() => setMode('none')}
            />
          )}
          <IconButton
            icon="paint-solid"
            label="Solid color"
            active={mode === 'solid'}
            onClick={() => setMode('solid')}
          />
          <IconButton
            icon="paint-linear"
            label="Linear gradient"
            active={mode === 'linear'}
            onClick={() => setMode('linear')}
          />
          <IconButton
            icon="paint-radial"
            label="Radial gradient"
            active={mode === 'radial'}
            onClick={() => setMode('radial')}
          />
        </div>
        {mode === 'solid' && (
          <SessionColorPicker
            value={solidColor}
            aria-label={`${label} color`}
            onPreview={(hex, recordHistory) => onChange(paintSolid(hex), recordHistory)}
          />
        )}
      </div>

      {(mode === 'linear' || mode === 'radial') && (
        <div className="paint-stops">
          {stops.map((stop, i) => (
            <div key={i} className="paint-stop-row">
              <SessionColorPicker
                value={stop.color}
                aria-label={`${label} stop ${i + 1} color`}
                onPreview={(hex, recordHistory) => updateStop(i, { color: hex }, recordHistory)}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={stop.offset}
                aria-label={`${label} stop ${i + 1} offset`}
                onChange={(e) => updateStop(i, { offset: Number(e.target.value) })}
              />
            </div>
          ))}
          {mode === 'linear' && paint.type === 'linear' && (
            <div className="paint-angles">
              <IconButton
                icon="angle-h"
                label="Horizontal"
                onClick={() => onChange({ ...paint, x1: 0, y1: 0.5, x2: 1, y2: 0.5 })}
              />
              <IconButton
                icon="angle-v"
                label="Vertical"
                onClick={() => onChange({ ...paint, x1: 0.5, y1: 0, x2: 0.5, y2: 1 })}
              />
              <IconButton
                icon="angle-diag"
                label="Diagonal"
                onClick={() => onChange({ ...paint, x1: 0, y1: 0, x2: 1, y2: 1 })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SessionColorPicker({
  value,
  'aria-label': ariaLabel,
  onPreview,
}: {
  value: string
  'aria-label': string
  onPreview: (hex: string, recordHistory: boolean) => void
}) {
  const session = useColorPickerSession()
  return (
    <ColorPicker
      value={value}
      aria-label={ariaLabel}
      size="sm"
      onOpen={() => session.commit()}
      onChange={(hex) => onPreview(hex, session.beginChange())}
      onCancel={() => session.cancel()}
      onCommit={() => session.commit()}
    />
  )
}
