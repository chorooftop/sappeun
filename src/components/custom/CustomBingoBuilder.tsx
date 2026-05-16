'use client'

import { ArrowLeft, Check, Edit3 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button, TextField } from '@/components/ui'
import {
  buildCustomBoardCells,
  CUSTOM_BOARD_DESCRIPTION_MAX,
  CUSTOM_BOARD_TITLE_MAX,
  CUSTOM_CELL_DESCRIPTION_MAX,
  CUSTOM_CELL_TITLE_MAX,
  customCellFallbackLabel,
} from '@/lib/bingo/customBoard'
import { saveBoardSession } from '@/lib/bingo/persistence'
import { createBoardSession } from '@/lib/bingo/session'
import { cn } from '@/lib/utils/cn'
import type { BoardMode } from '@/types/bingo'

interface CustomBingoBuilderProps {
  mode: BoardMode
  nickname: string
}

interface CellDraft {
  position: number
  title: string
  description: string
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function TextAreaField({
  id,
  label,
  value,
  maxLength,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  maxLength: number
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="text-caption font-semibold text-ink-700">
        {label}
      </label>
      <div className="rounded-sm border-[1.5px] border-ink-300 bg-paper px-4 py-3 transition-colors focus-within:border-2 focus-within:border-brand-primary">
        <textarea
          id={id}
          value={value}
          maxLength={maxLength}
          rows={3}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-20 w-full resize-none bg-transparent text-body-1 leading-normal text-ink-900 outline-none placeholder:text-ink-500"
        />
        <p className="text-right text-caption text-ink-500">
          {value.length}/{maxLength}
        </p>
      </div>
    </div>
  )
}

export function CustomBingoBuilder({
  mode,
  nickname,
}: CustomBingoBuilderProps) {
  const router = useRouter()
  const side = mode === '3x3' ? 3 : 5
  const freePosition = mode === '3x3' ? 4 : 12
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [drafts, setDrafts] = useState<CellDraft[]>(() =>
    Array.from({ length: side * side }, (_, position) => ({
      position,
      title: '',
      description: '',
    })).filter((draft) => draft.position !== freePosition),
  )

  const filledCount = drafts.filter((draft) => draft.title.trim()).length
  const canStart = nickname.trim().length > 0
  const gridPreview = useMemo(
    () => Array.from({ length: side * side }, (_, position) => position),
    [side],
  )

  function updateDraft(
    position: number,
    field: 'title' | 'description',
    value: string,
  ) {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.position === position ? { ...draft, [field]: value } : draft,
      ),
    )
  }

  function handleStart() {
    if (!canStart) return
    const sessionId = createSessionId()
    const customBoard = buildCustomBoardCells({
      mode,
      sessionId,
      drafts: drafts.map((draft) => ({
        position: draft.position,
        title: draft.title.trim(),
        description: draft.description.trim(),
      })),
    })
    const session = {
      ...createBoardSession({
        sessionId,
        mode,
        nickname,
        cells: customBoard.cells,
        freePosition: customBoard.freePosition,
        boardKind: 'custom',
        title: title.trim() || '커스텀 빙고',
        description: description.trim(),
        missionSnapshots: customBoard.missionSnapshots,
      }),
    }

    saveBoardSession(session)
    const qs = new URLSearchParams({ mode, nickname })
    router.push(`/bingo?${qs.toString()}`)
  }

  return (
    <AppShell maxWidth="board" panelClassName="bg-canvas pb-28 md:pb-0">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="홈으로"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 hover:bg-ink-100"
        >
          <ArrowLeft size={22} aria-hidden />
        </button>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-ink-900">커스텀 빙고</p>
          <p className="text-[11px] text-ink-500">{mode} 보드</p>
        </div>
        <ThemeToggle compact />
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 py-5">
        <section className="flex flex-col gap-4 rounded-lg bg-paper p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-primary text-paper">
              <Edit3 size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-body-1 font-semibold text-ink-900">
                빙고판 정보
              </p>
              <p className="text-caption text-ink-500">
                {filledCount}/{drafts.length}칸 이름 입력됨
              </p>
            </div>
          </div>
          <TextField
            label="빙고판 이름"
            value={title}
            maxLength={CUSTOM_BOARD_TITLE_MAX}
            showCounter
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예) 주말 동네 산책"
          />
          <TextAreaField
            id="board-description"
            label="빙고판 설명"
            value={description}
            maxLength={CUSTOM_BOARD_DESCRIPTION_MAX}
            placeholder="예) 오늘 산책에서 찾고 싶은 장면들"
            onChange={setDescription}
          />
        </section>

        <section className="flex flex-col gap-3">
          <div
            className={cn(
              'grid gap-1.5 rounded-lg bg-paper p-3 shadow-card',
              side === 5 ? 'grid-cols-5' : 'grid-cols-3',
            )}
            aria-label="커스텀 빙고 미리보기"
          >
            {gridPreview.map((position) => {
              const draft = drafts.find((item) => item.position === position)
              const filled = position === freePosition || Boolean(draft?.title.trim())
              const label = draft?.title.trim() || customCellFallbackLabel(position)
              return (
                <div
                  key={position}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-cell border px-1 text-center text-[10px] font-semibold leading-tight',
                    position === freePosition
                      ? 'border-brand-primary bg-brand-primary text-paper'
                      : filled
                        ? 'border-brand-primary/40 bg-brand-primary-soft text-brand-primary'
                        : 'border-ink-100 bg-ink-50 text-ink-400',
                  )}
                >
                  {position === freePosition ? 'FREE' : label}
                </div>
              )
            })}
          </div>

          {drafts.map((draft) => (
            <article
              key={draft.position}
              className="flex flex-col gap-3 rounded-lg border border-ink-100 bg-paper p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-body-2 font-semibold text-ink-900">
                  {draft.position + 1}번 칸
                </p>
                {draft.title.trim() && (
                  <span className="flex items-center gap-1 rounded-pill bg-brand-primary-soft px-2 py-1 text-caption font-semibold text-brand-primary">
                    <Check size={13} aria-hidden />
                    입력됨
                  </span>
                )}
              </div>
              <TextField
                label="칸 이름"
                value={draft.title}
                maxLength={CUSTOM_CELL_TITLE_MAX}
                showCounter
                onChange={(event) =>
                  updateDraft(draft.position, 'title', event.target.value)
                }
                placeholder="예) 노란 간판"
              />
              <TextAreaField
                id={`cell-${draft.position}-description`}
                label="칸 설명"
                value={draft.description}
                maxLength={CUSTOM_CELL_DESCRIPTION_MAX}
                placeholder="촬영할 때 보고 싶은 기준을 적어주세요"
                onChange={(value) =>
                  updateDraft(draft.position, 'description', value)
                }
              />
            </article>
          ))}
        </section>
      </main>

      <footer className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-ink-100 bg-paper px-4 pb-8 pt-4 md:static md:mx-auto md:max-w-[520px] md:translate-x-0 md:border-t-0 md:bg-transparent md:px-4 md:pb-6">
        <Button fullWidth size="lg" disabled={!canStart} onClick={handleStart}>
          빙고 시작
        </Button>
      </footer>
    </AppShell>
  )
}
