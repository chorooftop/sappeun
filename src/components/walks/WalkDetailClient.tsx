'use client'

import { ArrowLeft, Check, Clapperboard, Clock3, Play, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { boardSummaryLabel } from '@/lib/bingo/boardLabels'
import { DynamicIcon } from '@/lib/icons/dynamic-icon'
import { cn } from '@/lib/utils/cn'
import type {
  BoardHistoryCell,
  BoardHistoryDetail,
} from '@/types/board-history'

interface WalkDetailClientProps {
  board: BoardHistoryDetail
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

function clipLabel(cell: BoardHistoryCell) {
  return cell.mission.captureLabel ?? cell.mission.label
}

export function WalkDetailClient({ board }: WalkDetailClientProps) {
  const side = board.mode === '3x3' ? 3 : 5
  const total = board.mode === '3x3' ? 9 : 25
  const [selectedClip, setSelectedClip] = useState<BoardHistoryCell | null>(null)

  return (
    <AppShell maxWidth="board" panelClassName="bg-canvas">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <Link
          href="/walks"
          aria-label="산책 기록으로"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 hover:bg-ink-100"
        >
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <div className="min-w-0 text-center">
          <p className="truncate text-[15px] font-semibold text-ink-900">
            {board.title}
          </p>
          <p className="text-[11px] text-ink-500">
            {boardSummaryLabel(board.boardKind, board.mode)}
          </p>
        </div>
        <ThemeToggle compact />
      </header>

      <section className="grid grid-cols-3 gap-2 bg-paper px-4 py-3 text-[length:var(--text-caption)] font-semibold">
        <span className="rounded-md bg-brand-primary-soft px-3 py-2 text-center text-brand-primary">
          {board.endedAt ? '종료된 미션' : '진행중'}
        </span>
        <span className="rounded-md bg-ink-50 px-3 py-2 text-center text-ink-700">
          {board.completedCount}/{total}
        </span>
        <span className="rounded-md bg-brand-accent-soft px-3 py-2 text-center text-brand-accent">
          클립 {board.clipCount}
        </span>
      </section>

      <section className="bg-paper px-4 pb-3 text-center text-[length:var(--text-caption)] leading-normal text-ink-500">
        {board.description || formatDate(board.createdAt)}
      </section>

      {board.cells.length === 0 ? (
        <section className="mx-4 mt-5 rounded-lg border border-stroke-default bg-paper p-4 text-center shadow-card">
          <Clapperboard
            size={28}
            strokeWidth={1.8}
            className="mx-auto text-ink-500"
            aria-hidden
          />
          <p className="mt-2 text-[length:var(--text-body-1)] font-semibold text-ink-900">
            저장된 미션 정보가 없어요
          </p>
          <p className="mt-1 text-[length:var(--text-body-2)] leading-normal text-ink-500">
            이전 버전에서 만들어진 기록이라 상세 미션을 복원할 수 없어요.
            새 산책부터는 미션과 클립이 함께 저장돼요.
          </p>
        </section>
      ) : (
        <div
          className={cn(
            'mx-auto grid w-full max-w-[430px] gap-1.5 px-3 py-4 min-[390px]:px-4 md:max-w-[520px] md:gap-2 md:px-5',
            side === 5 ? 'grid-cols-5' : 'grid-cols-3',
          )}
        >
          {board.cells.map((cell) => {
            const label = clipLabel(cell)
            const completed = Boolean(cell.clip || cell.photo || cell.markedAt || cell.completedAt)
            const cellClassName = cn(
              'relative flex aspect-square min-w-0 overflow-hidden rounded-cell border-[1.5px] text-center shadow-card',
              completed
                ? 'border-brand-primary bg-brand-primary text-paper'
                : 'border-ink-100 bg-paper text-ink-700',
            )

            if (cell.clip) {
              return (
                <button
                  key={`${cell.position}-${cell.cellId}`}
                  type="button"
                  onClick={() => setSelectedClip(cell)}
                  className={cellClassName}
                  aria-label={`${label} 클립 크게 보기`}
                >
                  <video
                    src={cell.clip.clipUrl}
                    poster={cell.clip.posterUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/75 to-transparent px-1 pb-1 pt-5">
                    <span className="line-clamp-1 text-[10px] font-semibold text-paper">
                      {label}
                    </span>
                  </span>
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-pill bg-brand-primary text-paper shadow">
                    <Check size={12} strokeWidth={3} aria-hidden />
                  </span>
                  <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-pill bg-ink-900/65 text-paper shadow">
                    <Play size={11} fill="currentColor" strokeWidth={2.4} aria-hidden />
                  </span>
                </button>
              )
            }

            return (
              <article
                key={`${cell.position}-${cell.cellId}`}
                className={cellClassName}
              >
                {cell.photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cell.photo.previewUrl}
                      alt={`${label} 촬영 사진`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/75 to-transparent px-1 pb-1 pt-5">
                      <span className="line-clamp-1 text-[10px] font-semibold text-paper">
                        {label}
                      </span>
                    </span>
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-pill bg-brand-primary text-paper shadow">
                      <Check size={12} strokeWidth={3} aria-hidden />
                    </span>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 py-1">
                    {completed ? (
                      <Check size={26} strokeWidth={3} aria-hidden />
                    ) : cell.mission.icon ? (
                      <DynamicIcon
                        name={cell.mission.icon}
                        size={24}
                        strokeWidth={1.9}
                        aria-hidden
                      />
                    ) : (
                      <Clapperboard size={24} strokeWidth={1.9} aria-hidden />
                    )}
                    <span className="line-clamp-2 break-keep text-[10px] font-semibold leading-tight">
                      {cell.mission.label}
                    </span>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <section className="flex flex-col gap-2 px-4 pb-8">
        {board.cells
          .filter((cell) => cell.clip)
          .map((cell) => {
            const label = clipLabel(cell)
            return (
              <button
                type="button"
                key={cell.clip!.clipId}
                onClick={() => setSelectedClip(cell)}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg bg-paper p-3 text-left shadow-card"
              >
                <video
                  src={cell.clip!.clipUrl}
                  poster={cell.clip!.posterUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={`${label} 클립`}
                  className="h-[72px] w-[72px] rounded-md object-cover"
                />
                <div className="flex min-w-0 flex-col justify-center gap-1">
                  <p className="truncate text-[length:var(--text-body-2)] font-semibold text-ink-900">
                    {label}
                  </p>
                  <p className="flex items-center gap-1.5 text-[length:var(--text-caption)] text-ink-500">
                    <Clock3 size={13} aria-hidden />
                    {cell.clip!.recordedAt
                      ? formatDate(cell.clip!.recordedAt)
                      : '촬영 시간 기록 없음'}
                  </p>
                  {cell.clip!.description && (
                    <p className="line-clamp-1 text-[length:var(--text-caption)] text-ink-500">
                      {cell.clip!.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
      </section>

      {selectedClip?.clip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${clipLabel(selectedClip)} 클립 크게 보기`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-overlay-scrim px-0 sm:items-center sm:p-6"
        >
          <div className="w-full max-w-[430px] overflow-hidden rounded-t-lg bg-paper shadow-card sm:rounded-lg">
            <header className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink-900">
                  {clipLabel(selectedClip)}
                </p>
                <p className="text-[12px] text-ink-500">
                  {selectedClip.clip.recordedAt
                    ? formatDate(selectedClip.clip.recordedAt)
                    : '촬영 시간 기록 없음'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClip(null)}
                aria-label="클립 크게 보기 닫기"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill text-ink-900 hover:bg-ink-100"
              >
                <X size={20} aria-hidden />
              </button>
            </header>
            <div className="px-4">
              <div className="aspect-square overflow-hidden rounded-md bg-ink-100">
                <video
                  src={selectedClip.clip.clipUrl}
                  poster={selectedClip.clip.posterUrl}
                  autoPlay
                  controls
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
              <p className="rounded-md bg-ink-50 px-3 py-3 text-[length:var(--text-body-2)] leading-normal text-ink-700">
                {selectedClip.clip.description || '작성된 영상 소개가 없어요.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
