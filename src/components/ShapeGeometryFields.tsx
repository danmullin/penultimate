import type { VecNode } from '../types'
import { pathFromPrimitive, type ShapeCreateValues } from '../ops/shapes'
import { useDocStore } from '../store/documentStore'

type CreateProps = {
  mode: 'create'
  kind: 'rect' | 'rounded-rect' | 'ellipse' | 'line' | 'polygon' | 'star'
  values: ShapeCreateValues
  onChange: (next: ShapeCreateValues) => void
}

type EditProps = {
  mode: 'edit'
  node: VecNode
}

type Props = CreateProps | EditProps

/** Shared numeric fields for shape create dialog + Appearance panel. */
export function ShapeGeometryFields(props: Props) {
  if (props.mode === 'create') {
    return <CreateFields kind={props.kind} values={props.values} onChange={props.onChange} />
  }
  return <EditFields node={props.node} />
}

function CreateFields({
  kind,
  values,
  onChange,
}: {
  kind: CreateProps['kind']
  values: ShapeCreateValues
  onChange: (next: ShapeCreateValues) => void
}) {
  const set = (partial: Partial<ShapeCreateValues>) => onChange({ ...values, ...partial })

  if (kind === 'line') {
    return (
      <div className="shape-fields">
        <NumField
          label="Length"
          value={values.length}
          min={1}
          onChange={(length) => set({ length })}
        />
        <NumField
          label="Angle (°)"
          value={values.angle}
          onChange={(angle) => set({ angle })}
        />
      </div>
    )
  }

  if (kind === 'polygon') {
    return (
      <div className="shape-fields">
        <NumField
          label="Sides"
          value={values.sides}
          min={3}
          step={1}
          onChange={(sides) => set({ sides })}
        />
        <NumField
          label="Radius"
          value={values.radius}
          min={1}
          onChange={(radius) => set({ radius })}
        />
      </div>
    )
  }

  if (kind === 'star') {
    return (
      <div className="shape-fields">
        <NumField
          label="Points"
          value={values.points}
          min={3}
          step={1}
          onChange={(points) => set({ points })}
        />
        <NumField
          label="Outer radius"
          value={values.radius}
          min={1}
          onChange={(radius) => set({ radius })}
        />
        <NumField
          label="Inner radius"
          value={values.innerRadius}
          min={0.5}
          onChange={(innerRadius) => set({ innerRadius })}
        />
      </div>
    )
  }

  return (
    <div className="shape-fields">
      <div className="field-row">
        <NumField
          label="Width"
          value={values.width}
          min={1}
          onChange={(width) => set({ width })}
        />
        <NumField
          label="Height"
          value={values.height}
          min={1}
          onChange={(height) => set({ height })}
        />
      </div>
      {kind === 'rounded-rect' && (
        <NumField
          label="Corner radius"
          value={values.rx}
          min={0}
          onChange={(rx) => set({ rx })}
        />
      )}
      {kind === 'ellipse' && (
        <p className="shape-fields__hint">Placed centered on the click.</p>
      )}
      {(kind === 'rect' || kind === 'rounded-rect') && (
        <p className="shape-fields__hint">Placed from the click as top-left.</p>
      )}
    </div>
  )
}

function EditFields({ node }: { node: VecNode }) {
  const updateNode = useDocStore((s) => s.updateNode)

  if (node.type === 'rect') {
    return (
      <div className="shape-fields">
        <div className="field-row">
          <NumField
            label="X"
            value={node.x}
            onChange={(x) => updateNode(node.id, { x } as never, true)}
          />
          <NumField
            label="Y"
            value={node.y}
            onChange={(y) => updateNode(node.id, { y } as never, true)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="Width"
            value={node.width}
            min={1}
            onChange={(width) =>
              updateNode(node.id, { width: Math.max(1, width) } as never, true)
            }
          />
          <NumField
            label="Height"
            value={node.height}
            min={1}
            onChange={(height) =>
              updateNode(node.id, { height: Math.max(1, height) } as never, true)
            }
          />
        </div>
        <NumField
          label="Corner radius"
          value={node.rx ?? 0}
          min={0}
          onChange={(rx) =>
            updateNode(node.id, { rx: Math.max(0, rx) } as never, true)
          }
        />
      </div>
    )
  }

  if (node.type === 'ellipse') {
    return (
      <div className="shape-fields">
        <div className="field-row">
          <NumField
            label="Center X"
            value={node.cx}
            onChange={(cx) => updateNode(node.id, { cx } as never, true)}
          />
          <NumField
            label="Center Y"
            value={node.cy}
            onChange={(cy) => updateNode(node.id, { cy } as never, true)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="Width"
            value={round2(node.rx * 2)}
            min={1}
            onChange={(width) =>
              updateNode(node.id, { rx: Math.max(0.5, width / 2) } as never, true)
            }
          />
          <NumField
            label="Height"
            value={round2(node.ry * 2)}
            min={1}
            onChange={(height) =>
              updateNode(node.id, { ry: Math.max(0.5, height / 2) } as never, true)
            }
          />
        </div>
      </div>
    )
  }

  if (node.type === 'line') {
    const length = Math.hypot(node.x2 - node.x1, node.y2 - node.y1)
    const angle = (Math.atan2(node.y2 - node.y1, node.x2 - node.x1) * 180) / Math.PI
    return (
      <div className="shape-fields">
        <div className="field-row">
          <NumField
            label="X1"
            value={node.x1}
            onChange={(x1) => updateNode(node.id, { x1 } as never, true)}
          />
          <NumField
            label="Y1"
            value={node.y1}
            onChange={(y1) => updateNode(node.id, { y1 } as never, true)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="X2"
            value={node.x2}
            onChange={(x2) => updateNode(node.id, { x2 } as never, true)}
          />
          <NumField
            label="Y2"
            value={node.y2}
            onChange={(y2) => updateNode(node.id, { y2 } as never, true)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="Length"
            value={round2(length)}
            min={1}
            onChange={(len) => {
              const rad = (angle * Math.PI) / 180
              const L = Math.max(1, len)
              updateNode(
                node.id,
                {
                  x2: round2(node.x1 + Math.cos(rad) * L),
                  y2: round2(node.y1 + Math.sin(rad) * L),
                } as never,
                true,
              )
            }}
          />
          <NumField
            label="Angle (°)"
            value={round2(angle)}
            onChange={(ang) => {
              const rad = (ang * Math.PI) / 180
              const L = Math.max(1, length)
              updateNode(
                node.id,
                {
                  x2: round2(node.x1 + Math.cos(rad) * L),
                  y2: round2(node.y1 + Math.sin(rad) * L),
                } as never,
                true,
              )
            }}
          />
        </div>
      </div>
    )
  }

  if (node.type === 'path' && node.primitive?.kind === 'polygon') {
    const p = node.primitive
    const apply = (next: typeof p) =>
      updateNode(
        node.id,
        { primitive: next, d: pathFromPrimitive(next) } as never,
        true,
      )
    return (
      <div className="shape-fields">
        <div className="field-row">
          <NumField label="Center X" value={p.cx} onChange={(cx) => apply({ ...p, cx })} />
          <NumField label="Center Y" value={p.cy} onChange={(cy) => apply({ ...p, cy })} />
        </div>
        <NumField
          label="Sides"
          value={p.sides}
          min={3}
          step={1}
          onChange={(sides) => apply({ ...p, sides: Math.max(3, Math.round(sides)) })}
        />
        <NumField
          label="Radius"
          value={p.radius}
          min={1}
          onChange={(radius) => apply({ ...p, radius: Math.max(1, radius) })}
        />
      </div>
    )
  }

  if (node.type === 'path' && node.primitive?.kind === 'star') {
    const p = node.primitive
    const apply = (next: typeof p) =>
      updateNode(
        node.id,
        { primitive: next, d: pathFromPrimitive(next) } as never,
        true,
      )
    return (
      <div className="shape-fields">
        <div className="field-row">
          <NumField label="Center X" value={p.cx} onChange={(cx) => apply({ ...p, cx })} />
          <NumField label="Center Y" value={p.cy} onChange={(cy) => apply({ ...p, cy })} />
        </div>
        <NumField
          label="Points"
          value={p.points}
          min={3}
          step={1}
          onChange={(points) => apply({ ...p, points: Math.max(3, Math.round(points)) })}
        />
        <NumField
          label="Outer radius"
          value={p.outerRadius}
          min={1}
          onChange={(outerRadius) => apply({ ...p, outerRadius: Math.max(1, outerRadius) })}
        />
        <NumField
          label="Inner radius"
          value={p.innerRadius}
          min={0.5}
          onChange={(innerRadius) => apply({ ...p, innerRadius: Math.max(0.5, innerRadius) })}
        />
      </div>
    )
  }

  return null
}

function NumField({
  label,
  value,
  onChange,
  min,
  step = 1,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  step?: number
}) {
  return (
    <label className="field-inline">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isFinite(n)) return
          onChange(min !== undefined ? Math.max(min, n) : n)
        }}
      />
    </label>
  )
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** True when Appearance should show geometry editors for this node. */
export function hasEditableGeometry(node: VecNode): boolean {
  if (node.type === 'rect' || node.type === 'ellipse' || node.type === 'line') return true
  if (node.type === 'path' && node.primitive) return true
  return false
}
