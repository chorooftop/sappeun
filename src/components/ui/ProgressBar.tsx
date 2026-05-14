import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
}

export function ProgressBar({
  value,
  max = 1,
  label,
  className,
  ...props
}: ProgressBarProps) {
  const normalizedMax = max > 0 ? max : 1
  const clamped = Math.min(Math.max(value / normalizedMax, 0), 1)

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={normalizedMax}
      aria-valuenow={Number((clamped * normalizedMax).toFixed(2))}
      className={cn('h-1.5 w-full overflow-hidden rounded-pill bg-ink-100', className)}
      {...props}
    >
      <div
        className="h-full rounded-pill bg-brand-primary transition-[width] duration-200"
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}
