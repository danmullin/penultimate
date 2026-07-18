import type { MouseEvent } from 'react'
import { useTooltip } from './Tooltip'

/** SVG icon from /icons/{name}.svg (public/). Tinted via CSS mask + currentColor. */
export function Icon({ name }: { name: string }) {
  const url = `/icons/${name}.svg`
  return (
    <span
      className={`i i--img i--${name}`}
      aria-hidden="true"
      style={{
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        backgroundColor: 'currentColor',
      }}
    />
  )
}

type IconButtonProps = {
  icon: string
  label: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  active?: boolean
  danger?: boolean
  primary?: boolean
  className?: string
  type?: 'button' | 'submit'
}

export function IconButton({
  icon,
  label,
  onClick,
  disabled,
  active,
  danger,
  primary,
  className = '',
  type = 'button',
}: IconButtonProps) {
  const tip = useTooltip(label)
  const base = primary ? 'primary-btn' : 'ghost-btn'
  return (
    <button
      type={type}
      className={`${base} btn-icon${active ? ' ghost-btn--active' : ''}${danger ? ' danger' : ''}${className ? ` ${className}` : ''}`}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      {...tip}
    >
      <Icon name={icon} />
    </button>
  )
}
