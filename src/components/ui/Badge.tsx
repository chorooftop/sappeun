import type { HTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string
}

export function Badge({ label, className, ...props }: BadgeProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-pill bg-brand-primary text-paper',
        className,
      )}
      {...props}
    >
      <Check size={16} strokeWidth={3} aria-hidden />
    </span>
  )
}
