import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type IconButtonVariant = 'default' | 'ghost' | 'close'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: IconButtonVariant
  iconSize?: number
  'aria-label': string
}

const variantClass: Record<IconButtonVariant, string> = {
  default: 'border border-stroke-default bg-paper text-ink-900 hover:bg-ink-50',
  ghost: 'bg-transparent text-ink-900 hover:bg-ink-100',
  close: 'bg-transparent text-ink-900 hover:bg-ink-100',
}

export function IconButton({
  icon: Icon,
  variant = 'default',
  iconSize,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const resolvedIconSize = iconSize ?? (variant === 'default' ? 20 : 24)

  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill transition-colors disabled:pointer-events-none disabled:opacity-40',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      <Icon size={resolvedIconSize} aria-hidden />
    </button>
  )
}
