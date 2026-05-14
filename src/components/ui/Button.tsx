import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-paper shadow-cell-glow hover:bg-brand-primary-hover',
  secondary:
    'border-[1.5px] border-brand-primary bg-paper text-brand-primary hover:bg-brand-primary-soft',
  tertiary: 'bg-transparent text-ink-700 hover:bg-ink-100',
  destructive: 'bg-danger text-paper hover:brightness-95',
}

const sizeClass: Record<ButtonSize, string> = {
  md: 'min-h-12 px-6 py-3 text-[length:var(--text-body-1)]',
  lg: 'min-h-14 px-8 py-4 text-[length:var(--text-title)]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill font-semibold leading-normal transition-colors disabled:pointer-events-none',
        sizeClass[size],
        disabled ? 'bg-ink-300 text-ink-500 shadow-none' : variantClass[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
