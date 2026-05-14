import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hint?: string
  showCounter?: boolean
  error?: string
  previewState?: 'default' | 'focus'
}

function valueLength(value: TextFieldProps['value']) {
  return typeof value === 'string' ? value.length : 0
}

export function TextField({
  id,
  label,
  hint,
  showCounter = false,
  maxLength,
  value,
  error,
  previewState = 'default',
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const currentLength = valueLength(value)
  const helperText = error ?? hint
  const isPreviewFocused = previewState === 'focus'
  const inputId = id ?? generatedId
  const helperId = helperText ? `${inputId}-helper` : undefined
  const describedBy =
    [ariaDescribedBy, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className="text-caption font-semibold leading-normal text-ink-700"
      >
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-12 items-center justify-between gap-3 rounded-sm border-[1.5px] bg-paper px-4 py-3 transition-colors focus-within:border-2 focus-within:border-brand-primary',
          error ? 'border-danger' : 'border-ink-300',
          isPreviewFocused && !error && 'border-2 border-brand-primary',
        )}
      >
        <input
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          className="min-w-0 flex-1 bg-transparent text-body-1 leading-normal text-ink-900 outline-none placeholder:text-ink-500"
          {...props}
        />
        {showCounter && maxLength && (
          <span className="shrink-0 text-caption leading-normal text-ink-500">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      {helperText && (
        <p
          id={helperId}
          className={cn(
            'text-[length:var(--text-micro)] leading-normal',
            error ? 'text-danger' : 'text-ink-500',
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
