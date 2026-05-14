'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  applyThemePreference,
  readStoredThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
  writeStoredThemePreference,
} from './theme'
import { cn } from '@/lib/utils/cn'

const THEME_SEQUENCE: ThemePreference[] = ['system', 'dark', 'light']
const THEME_CHANGE_EVENT = 'sappeun-theme-change'

const THEME_META: Record<
  ThemePreference,
  {
    label: string
    actionLabel: string
    icon: typeof Monitor
  }
> = {
  system: {
    label: '시스템',
    actionLabel: '다크 모드로 변경',
    icon: Monitor,
  },
  dark: {
    label: '다크',
    actionLabel: '라이트 모드로 변경',
    icon: Moon,
  },
  light: {
    label: '라이트',
    actionLabel: '시스템 설정으로 변경',
    icon: Sun,
  },
}

interface ThemeToggleProps {
  compact?: boolean
  className?: string
}

function getInitialTheme(): ThemePreference {
  return readStoredThemePreference()
}

function subscribeTheme(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY) callback()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(THEME_CHANGE_EVENT, callback)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
  }
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getInitialTheme,
    (): ThemePreference => 'system',
  )

  useEffect(() => {
    applyThemePreference(theme)
  }, [theme])

  const meta = THEME_META[theme]
  const Icon = meta.icon

  const nextTheme = useMemo(() => {
    const currentIndex = THEME_SEQUENCE.indexOf(theme)
    return THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length]
  }, [theme])

  function handleClick() {
    applyThemePreference(nextTheme)
    writeStoredThemePreference(nextTheme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 shrink-0 items-center justify-center rounded-pill border border-stroke-default bg-paper text-ink-900 transition-colors hover:bg-ink-50',
        compact ? 'w-11' : 'gap-1.5 px-3 text-[length:var(--text-caption)] font-semibold',
        className,
      )}
      aria-label={`${meta.label} 테마 사용 중, ${meta.actionLabel}`}
      title={`${meta.label} 테마`}
      onClick={handleClick}
    >
      <Icon size={compact ? 20 : 18} aria-hidden />
      {!compact && <span>{meta.label}</span>}
    </button>
  )
}
