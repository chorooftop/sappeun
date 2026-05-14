import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type TagVariant = 'default' | 'brand' | 'noPhoto'

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant
  icon?: LucideIcon
}

const variantClass: Record<TagVariant, string> = {
  default: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-primary-soft text-brand-primary',
  noPhoto: 'border border-ink-300 bg-ink-100 text-ink-500',
}

export function Tag({
  variant = 'default',
  icon: Icon,
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[length:var(--text-caption)] font-semibold leading-normal',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  )
}
