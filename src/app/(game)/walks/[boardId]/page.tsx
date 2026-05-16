import { ArrowLeft, Camera, Check, Clock3 } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { getCurrentAuthState } from '@/lib/auth/session'
import { getUserBoardDetail } from '@/lib/boards/server'
import { DynamicIcon } from '@/lib/icons/dynamic-icon'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{
    boardId: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export default async function WalkDetailPage({ params }: PageProps) {
  const authState = await getCurrentAuthState()
  if (!authState.user || !authState.profile?.signupCompletedAt) {
    redirect(`/login?${new URLSearchParams({ next: '/walks' }).toString()}`)
  }

  const { boardId } = await params
  const board = await getUserBoardDetail(authState.user.id, boardId)
  if (!board) notFound()

  const side = board.mode === '3x3' ? 3 : 5
  const total = board.mode === '3x3' ? 9 : 25

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
            {board.nickname}
          </p>
          <p className="text-[11px] text-ink-500">
            {formatDate(board.createdAt)}
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
          사진 {board.photoCount}
        </span>
      </section>

      {board.cells.length === 0 ? (
        <section className="mx-4 mt-5 rounded-lg border border-stroke-default bg-paper p-4 text-center shadow-card">
          <Camera
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
            새 산책부터는 미션과 사진이 함께 저장돼요.
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
            const label = cell.mission.captureLabel ?? cell.mission.label
            const completed = Boolean(cell.photo || cell.markedAt || cell.completedAt)
            return (
              <article
                key={`${cell.position}-${cell.cellId}`}
                className={cn(
                  'relative flex aspect-square min-w-0 overflow-hidden rounded-cell border-[1.5px] text-center shadow-card',
                  completed
                    ? 'border-brand-primary bg-brand-primary text-paper'
                    : 'border-ink-100 bg-paper text-ink-700',
                )}
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
                      <Camera size={24} strokeWidth={1.9} aria-hidden />
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
          .filter((cell) => cell.photo)
          .map((cell) => {
            const label = cell.mission.captureLabel ?? cell.mission.label
            return (
              <div
                key={cell.photo!.photoId}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg bg-paper p-3 shadow-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cell.photo!.previewUrl}
                  alt={`${label} 촬영 사진`}
                  className="h-[72px] w-[72px] rounded-md object-cover"
                />
                <div className="flex min-w-0 flex-col justify-center gap-1">
                  <p className="truncate text-[length:var(--text-body-2)] font-semibold text-ink-900">
                    {label}
                  </p>
                  <p className="flex items-center gap-1.5 text-[length:var(--text-caption)] text-ink-500">
                    <Clock3 size={13} aria-hidden />
                    {cell.photo!.capturedAt
                      ? formatDate(cell.photo!.capturedAt)
                      : '촬영 시간 기록 없음'}
                  </p>
                </div>
              </div>
            )
          })}
      </section>
    </AppShell>
  )
}
