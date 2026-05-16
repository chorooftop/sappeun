'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'

interface ActionDialogAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
  disabled?: boolean
}

interface ActionDialogProps {
  title: string
  description: string
  error?: string | null
  pendingLabel?: string
  isPending?: boolean
  actions: ActionDialogAction[]
  onClose: () => void
}

export function ActionDialog({
  title,
  description,
  error,
  pendingLabel = '처리 중',
  isPending = false,
  actions,
  onClose,
}: ActionDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isPending, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-dialog-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim px-0 sm:items-center sm:p-6"
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-t-lg bg-paper text-ink-900 shadow-card sm:rounded-lg">
        <header className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <h2 id="action-dialog-title" className="text-[20px] font-bold leading-tight">
              {title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
              {description}
            </p>
          </div>
          <IconButton
            ref={closeRef}
            icon={X}
            variant="ghost"
            aria-label="닫기"
            disabled={isPending}
            onClick={onClose}
          />
        </header>

        {error && (
          <p
            role="alert"
            className="mx-4 rounded-md border border-danger/30 bg-brand-accent-soft px-3 py-2 text-[13px] font-semibold leading-normal text-danger"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              fullWidth
              size="md"
              variant={action.variant ?? 'primary'}
              disabled={isPending || action.disabled}
              onClick={action.onClick}
            >
              {isPending ? pendingLabel : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
