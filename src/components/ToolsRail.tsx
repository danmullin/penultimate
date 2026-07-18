import type { Tool } from '../types'
import { useDocStore } from '../store/documentStore'
import { Icon } from './Icon'
import { useTooltip } from './Tooltip'

const TOOLS: Array<{ id: Tool; label: string; shortcut: string; icon: string }> = [
  { id: 'select', label: 'Selection', shortcut: 'V', icon: 'tool-select' },
  { id: 'direct', label: 'Direct Selection', shortcut: 'A', icon: 'tool-direct' },
  { id: 'pen', label: 'Pen', shortcut: 'P', icon: 'tool-pen' },
  { id: 'pencil', label: 'Pencil', shortcut: 'N', icon: 'tool-pencil' },
  { id: 'scissors', label: 'Scissors', shortcut: 'C', icon: 'tool-scissors' },
  { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I', icon: 'tool-eyedropper' },
  { id: 'text', label: 'Type', shortcut: 'T', icon: 'tool-text' },
  { id: 'area-text', label: 'Area Type', shortcut: 'Shift+T', icon: 'tool-area-text' },
  { id: 'line', label: 'Line', shortcut: 'L', icon: 'tool-line' },
  { id: 'rect', label: 'Rectangle', shortcut: 'R', icon: 'tool-rect' },
  { id: 'rounded-rect', label: 'Rounded Rectangle', shortcut: 'U', icon: 'tool-rounded-rect' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: 'tool-ellipse' },
  { id: 'polygon', label: 'Polygon', shortcut: 'Y', icon: 'tool-polygon' },
  { id: 'star', label: 'Star', shortcut: 'J', icon: 'tool-star' },
  { id: 'shear', label: 'Shear', shortcut: 'S', icon: 'tool-shear' },
  { id: 'hand', label: 'Hand', shortcut: 'H · hold Space', icon: 'tool-hand' },
  { id: 'zoom', label: 'Zoom', shortcut: 'Z', icon: 'tool-zoom' },
]

export function ToolsRail() {
  const tool = useDocStore((s) => s.tool)
  const setTool = useDocStore((s) => s.setTool)

  return (
    <aside className="tools-rail" aria-label="Tools">
      <div className="tools-rail__group">
        {TOOLS.slice(0, 2).map((t) => (
          <ToolButton key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />
        ))}
      </div>
      <div className="tools-rail__divider" />
      <div className="tools-rail__group">
        {TOOLS.slice(2, 8).map((t) => (
          <ToolButton key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />
        ))}
      </div>
      <div className="tools-rail__divider" />
      <div className="tools-rail__group">
        {TOOLS.slice(8).map((t) => (
          <ToolButton key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />
        ))}
      </div>
    </aside>
  )
}

function ToolButton({
  label,
  shortcut,
  icon,
  active,
  onClick,
}: {
  label: string
  shortcut: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  const tip = useTooltip(`${label} (${shortcut})`)
  return (
    <button
      type="button"
      className={`tool-btn${active ? ' tool-btn--active' : ''}`}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      {...tip}
    >
      <Icon name={icon} />
    </button>
  )
}
