type PanelHeaderProps = {
  title: string
  collapsed: boolean
  onToggle: () => void
}

/** Clickable sidebar panel title — collapses the body immediately. */
export function PanelHeader({ title, collapsed, onToggle }: PanelHeaderProps) {
  return (
    <button
      type="button"
      className="panel-header"
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <span className="panel-header__title">{title}</span>
      <span
        className={`panel-header__chevron${collapsed ? ' is-collapsed' : ''}`}
        aria-hidden
      >
        ▾
      </span>
    </button>
  )
}
