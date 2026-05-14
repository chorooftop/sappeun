'use client'

import {
  Ban,
  Camera,
  ChevronRight,
  Download,
  Hand,
  Menu,
  Printer,
  Shield,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { HomeHero } from '@/components/home/HomeHero'
import { Badge, Button, IconButton, TextField } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { BoardMode } from '@/types/bingo'

type SelectableMode = BoardMode

const MAX_NICKNAME_LENGTH = 10

const SAFETY_NOTES = [
  { icon: Shield, label: '혼잡한 곳은 피해주세요' },
  { icon: Ban, label: '걸으며 폰 보기는 금물' },
  { icon: Users, label: '12세 이하는 보호자와 함께' },
] as const

export default function Home() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [mode, setMode] = useState<SelectableMode>('5x5')
  const trimmed = nickname.trim()
  const canStart = trimmed.length > 0

  function handleStart() {
    if (!canStart) return
    const qs = new URLSearchParams({ mode, nickname: trimmed })
    router.push(`/bingo?${qs.toString()}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-1 flex-col bg-canvas pb-28 text-ink-900">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <IconButton icon={Menu} variant="ghost" aria-label="메뉴" />
        <p className="font-display text-[22px] font-bold leading-tight text-brand-primary">
          산책빙고
        </p>
        <IconButton icon={Download} variant="ghost" aria-label="저장" iconSize={20} />
      </header>

      <div className="flex flex-1 flex-col gap-5 px-4 pb-4 pt-5">
        <HomeHero />

        <TextField
          id="nickname"
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={MAX_NICKNAME_LENGTH}
          showCounter
          hint="한글·영문·이모지 1개 가능"
          placeholder="예) 산책요정 주연"
          autoComplete="off"
        />

        <section className="flex flex-col gap-3" aria-label="모드 선택">
          <PhotoModeCard
            selected={mode === '5x5' || mode === '3x3'}
            size={mode === '3x3' ? '3x3' : '5x5'}
            onSelect={() => setMode(mode === '3x3' ? '3x3' : '5x5')}
            onSizeChange={setMode}
          />
          <ModeCard
            icon={Hand}
            title="스탠다드 모드"
            description="사진 없이 가볍게 마킹"
            selected={mode === 'standard'}
            onClick={() => setMode('standard')}
          />
          <ModeCard
            icon={Printer}
            title="인쇄 모드"
            description="종이 빙고로 출력하기"
            tone="print"
            disabled
          />
        </section>

        <SafetyList />
      </div>

      <footer className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 border-t border-ink-100 bg-paper px-4 pb-8 pt-4">
        <Button fullWidth size="lg" disabled={!canStart} onClick={handleStart}>
          산책 시작하기
        </Button>
      </footer>
    </main>
  )
}

interface PhotoModeCardProps {
  selected: boolean
  size: Extract<BoardMode, '5x5' | '3x3'>
  onSelect: () => void
  onSizeChange: (size: Extract<BoardMode, '5x5' | '3x3'>) => void
}

function PhotoModeCard({
  selected,
  size,
  onSelect,
  onSizeChange,
}: PhotoModeCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg bg-brand-primary-soft p-4',
        selected && 'border-2 border-brand-primary',
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-4 text-left"
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <Camera size={24} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[length:var(--text-body-1)] font-semibold leading-normal text-ink-900">
            사진 모드
          </span>
          <span className="text-[length:var(--text-caption)] leading-normal text-ink-700">
            휴대폰 추천 · 정사각 자동 크롭
          </span>
        </span>
        {selected && <Badge label="선택됨" />}
      </button>

      <div className="flex items-center gap-2" aria-label="사진 모드 판 크기">
        <SizeChip
          label="5×5"
          selected={size === '5x5'}
          onClick={() => onSizeChange('5x5')}
        />
        <SizeChip
          label="3×3"
          selected={size === '3x3'}
          onClick={() => onSizeChange('3x3')}
        />
      </div>
    </div>
  )
}

interface SizeChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

function SizeChip({ label, selected, onClick }: SizeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-pill px-3 py-1 text-[length:var(--text-caption)] font-semibold leading-normal transition-colors',
        selected ? 'bg-brand-primary text-paper' : 'bg-paper text-ink-500',
      )}
    >
      {label}
    </button>
  )
}

interface ModeCardProps {
  icon: typeof Hand
  title: string
  description: string
  selected?: boolean
  disabled?: boolean
  tone?: 'default' | 'print'
  onClick?: () => void
}

function ModeCard({
  icon: Icon,
  title,
  description,
  selected = false,
  disabled = false,
  tone = 'default',
  onClick,
}: ModeCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-4 rounded-lg border bg-paper p-4 text-left transition-colors',
        selected ? 'border-brand-primary shadow-cell-glow' : 'border-ink-100',
        disabled ? 'cursor-not-allowed' : 'hover:border-brand-primary',
      )}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <span
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-md',
          tone === 'print'
            ? 'bg-brand-secondary-soft text-warning'
            : 'bg-ink-100 text-ink-700',
        )}
      >
        <Icon size={24} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[length:var(--text-body-1)] font-semibold leading-normal text-ink-900">
          {title}
        </span>
        <span className="text-[length:var(--text-caption)] leading-normal text-ink-700">
          {description}
        </span>
      </span>
      <ChevronRight size={20} className="text-ink-500" aria-hidden />
    </button>
  )
}

function SafetyList() {
  return (
    <section className="flex flex-col gap-1.5 px-1 pt-1" aria-label="안전 안내">
      {SAFETY_NOTES.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-ink-500">
          <Icon size={14} aria-hidden />
          <span className="text-[length:var(--text-caption)] leading-normal">
            {label}
          </span>
        </div>
      ))}
    </section>
  )
}
