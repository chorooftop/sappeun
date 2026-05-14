import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type AppShellMaxWidth = 'mobile' | 'tablet' | 'desktop' | 'board' | 'camera'

interface AppShellProps {
  children: ReactNode
  maxWidth?: AppShellMaxWidth
  className?: string
  panelClassName?: string
}

const maxWidthClass: Record<AppShellMaxWidth, string> = {
  mobile: 'max-w-[430px]',
  tablet: 'max-w-[430px] md:max-w-[760px]',
  desktop: 'max-w-[430px] md:max-w-[760px] lg:max-w-[1040px]',
  board: 'max-w-[430px] md:max-w-[560px]',
  camera: 'max-w-[430px] md:max-w-[640px]',
}

export function AppShell({
  children,
  maxWidth = 'mobile',
  className,
  panelClassName,
}: AppShellProps) {
  return (
    <main
      className={cn(
        'min-h-dvh bg-canvas text-ink-900 md:px-6 md:py-6',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full flex-col md:min-h-[calc(100dvh-48px)]',
          maxWidthClass[maxWidth],
          panelClassName,
        )}
      >
        {children}
      </div>
    </main>
  )
}
