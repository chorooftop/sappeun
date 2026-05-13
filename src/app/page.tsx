'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { BoardMode } from '@/types/bingo'

interface ModeOption {
  value: BoardMode
  title: string
  subtitle: string
  badge?: string
  toneClass: string
}

const MODE_OPTIONS: ReadonlyArray<ModeOption> = [
  {
    value: 'standard',
    title: '스탠다드',
    subtitle: '칸을 탭해서 마킹만. 가볍게 즐기는 모드.',
    toneClass:
      'border-brand-primary-soft bg-brand-primary-soft hover:border-brand-primary',
  },
  {
    value: '5x5',
    title: '사진 모드 · 5×5',
    subtitle: '카메라로 사물을 찍어 칸을 채워요.',
    toneClass: 'border-ink-100 bg-paper hover:border-brand-primary',
  },
  {
    value: '3x3',
    title: '사진 모드 · 3×3',
    subtitle: '짧은 산책용. 9칸만 채우면 끝.',
    toneClass: 'border-ink-100 bg-paper hover:border-brand-primary',
  },
]

const SAFETY_NOTES = [
  '사람이 많은 곳은 피하기',
  '걸으면서 휴대폰 보지 않기',
  '12세 이하는 보호자와 함께',
] as const

export default function Home() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [mode, setMode] = useState<BoardMode | null>(null)
  const trimmed = nickname.trim()
  const canStart = trimmed.length > 0 && mode !== null

  function handleStart() {
    if (!canStart || mode === null) return
    const qs = new URLSearchParams({ mode, nickname: trimmed })
    router.push(`/bingo?${qs.toString()}`)
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">
          사뿐
        </h1>
        <p className="text-sm text-ink-700">
          산책하며 빙고 칸의 사물을 찾아 완성하는 게임
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <label
          htmlFor="nickname"
          className="text-sm font-medium text-ink-700"
        >
          닉네임
        </label>
        <input
          id="nickname"
          type="text"
          autoComplete="off"
          maxLength={16}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 산뜻한산책가"
          className="w-full rounded-card border border-ink-100 bg-paper px-4 py-3 text-base text-ink-900 placeholder:text-ink-300 focus:border-brand-primary focus:outline-none"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-ink-700">모드 선택</h2>
        <div className="flex flex-col gap-3">
          {MODE_OPTIONS.map((opt) => {
            const selected = mode === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={cn(
                  'flex flex-col gap-1 rounded-card border-2 px-4 py-4 text-left transition-colors',
                  opt.toneClass,
                  selected
                    ? 'border-brand-primary shadow-cell-glow'
                    : 'border-transparent',
                )}
                aria-pressed={selected}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-ink-900">
                    {opt.title}
                  </span>
                  {opt.badge && (
                    <span className="rounded-pill bg-brand-secondary-soft px-2 py-0.5 text-xs font-medium text-ink-700">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <span className="text-sm text-ink-700">{opt.subtitle}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-card bg-ink-50 px-4 py-3 text-sm text-ink-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          안전하게 산책하기
        </span>
        <ul className="flex flex-col gap-1">
          {SAFETY_NOTES.map((note) => (
            <li key={note}>· {note}</li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className={cn(
          'mt-auto rounded-pill px-6 py-4 text-base font-semibold transition-colors',
          canStart
            ? 'bg-brand-primary text-paper shadow-cell-glow hover:brightness-95'
            : 'bg-ink-100 text-ink-300',
        )}
      >
        시작하기
      </button>
    </main>
  )
}
