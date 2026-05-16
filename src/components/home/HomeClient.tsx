'use client'

import {
  Ban,
  Clapperboard,
  Clock3,
  Edit3,
  Menu,
  Shield,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HomeHero } from '@/components/home/HomeHero'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ActionDialog, Badge, Button, IconButton, TextField } from '@/components/ui'
import {
  clearActiveBoardSession,
  loadActiveBoardSession,
  saveBoardSession,
  SESSION_CHANGE_EVENT,
} from '@/lib/bingo/persistence'
import { boardSummaryLabel } from '@/lib/bingo/boardLabels'
import {
  loadGuestProfile,
  saveGuestNickname,
} from '@/lib/bingo/guestProfile'
import {
  adoptGuestBoardSession,
  deleteBoardSession,
  deleteCurrentBoardSessions,
  updateProfileNickname,
} from '@/lib/boards/client'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { AuthProfileSummary } from '@/lib/auth/session'
import { cn } from '@/lib/utils/cn'
import type { BoardKind, BoardMode } from '@/types/bingo'
import type { PersistedBoardSession } from '@/types/persisted-board'

type SelectableMode = BoardMode
type ModeByKind = Record<BoardKind, SelectableMode>

const MAX_NICKNAME_LENGTH = 10

const SAFETY_NOTES = [
  { icon: Shield, label: '혼잡한 곳은 피해주세요' },
  { icon: Ban, label: '걸으며 폰 보기는 금물' },
  { icon: Users, label: '12세 이하는 보호자와 함께' },
] as const

interface HomeClientProps {
  authSummary: AuthProfileSummary
  initialActiveSession: PersistedBoardSession | null
}

export function HomeClient({
  authSummary,
  initialActiveSession,
}: HomeClientProps) {
  const router = useRouter()
  const [nickname, setNickname] = useState(() => (
    authSummary.nickname ??
    authSummary.displayName?.slice(0, MAX_NICKNAME_LENGTH) ??
    loadGuestProfile()?.nickname ??
    ''
  ))
  const [savedLoginNickname, setSavedLoginNickname] = useState(
    authSummary.nickname ?? '',
  )
  const [modeByKind, setModeByKind] = useState<ModeByKind>({
    mission: '5x5',
    custom: '5x5',
  })
  const [boardKind, setBoardKind] = useState<BoardKind>('mission')
  const [activeSession, setActiveSession] =
    useState<PersistedBoardSession | null>(initialActiveSession)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [startPending, setStartPending] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [clearPending, setClearPending] = useState(false)
  const trimmed = nickname.trim()
  const startNickname = trimmed || activeSession?.nickname.trim() || ''
  const canStart = startNickname.length > 0
  const selectedMode = modeByKind[boardKind]
  const showNicknameField =
    !authSummary.isAuthenticated || !authSummary.isSignupCompleted

  useEffect(() => {
    if (authSummary.isAuthenticated) return

    const timeout = window.setTimeout(() => {
      const guestNickname = loadGuestProfile()?.nickname
      if (guestNickname) setNickname(guestNickname)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [authSummary.isAuthenticated])

  useEffect(() => {
    let cancelled = false

    async function refreshIfCookieSessionExists() {
      if (authSummary.isAuthenticated) return

      try {
        const supabase = createBrowserSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!cancelled && user) router.refresh()
      } catch (error) {
        console.warn('Unable to re-check browser auth session', error)
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) router.refresh()
    }

    void refreshIfCookieSessionExists()
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [authSummary.isAuthenticated, router])

  useEffect(() => {
    function syncLocalActiveSession() {
      setActiveSession(loadActiveBoardSession())
    }

    window.addEventListener(SESSION_CHANGE_EVENT, syncLocalActiveSession)
    window.addEventListener('storage', syncLocalActiveSession)

    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, syncLocalActiveSession)
      window.removeEventListener('storage', syncLocalActiveSession)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      const localSession = loadActiveBoardSession()
      if (localSession) {
        if (
          authSummary.isAuthenticated &&
          authSummary.isSignupCompleted &&
          (localSession.version === 2 ||
            localSession.version === 3 ||
            localSession.version === 4)
        ) {
          void adoptGuestBoardSession(localSession)
            .then((adopted) => {
              if (cancelled) return
              const session = adopted ?? localSession
              saveBoardSession(session)
              setActiveSession(session)
            })
            .catch((error) => {
              console.warn('Unable to adopt local board session', error)
              if (!cancelled) setActiveSession(localSession)
            })
          return
        }
        setActiveSession(localSession)
        return
      }

      if (initialActiveSession) {
        saveBoardSession(initialActiveSession)
        setActiveSession(initialActiveSession)
        return
      }

      if (!authSummary.isAuthenticated || !authSummary.isSignupCompleted) {
        setActiveSession(null)
        return
      }

      void fetch('/api/boards/current', { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) return null
          return response.json() as Promise<{
            session: PersistedBoardSession | null
          }>
        })
        .then((payload) => {
          if (cancelled || !payload?.session) return
          saveBoardSession(payload.session)
          setActiveSession(payload.session)
        })
        .catch((error) => {
          console.warn('Unable to restore server board session', error)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [
    authSummary.isAuthenticated,
    authSummary.isSignupCompleted,
    initialActiveSession,
  ])

  function handleNicknameChange(value: string) {
    setNickname(value)
    if (!authSummary.isAuthenticated) {
      saveGuestNickname(value)
    }
  }

  function persistLoginNickname(value = trimmed) {
    if (
      !value ||
      !authSummary.isAuthenticated ||
      !authSummary.isSignupCompleted ||
      value === savedLoginNickname
    ) {
      return
    }

    void updateProfileNickname(value)
      .then(() => setSavedLoginNickname(value))
      .catch((error) => {
        console.warn('Unable to update nickname', error)
      })
  }

  function pushNewWalk() {
    if (!authSummary.isAuthenticated) {
      saveGuestNickname(startNickname)
    } else {
      persistLoginNickname(startNickname)
    }
    const qs = new URLSearchParams({ mode: selectedMode, nickname: startNickname })
    router.push(
      boardKind === 'custom'
        ? `/custom?${qs.toString()}`
        : `/bingo?${qs.toString()}`,
    )
  }

  function handleStart() {
    if (!canStart) return
    if (activeSession) {
      setStartError(null)
      setStartDialogOpen(true)
      return
    }
    pushNewWalk()
  }

  async function handleConfirmNewStart() {
    if (!activeSession || !canStart) return

    setStartPending(true)
    setStartError(null)
    try {
      if (
        (activeSession.version === 2 ||
          activeSession.version === 3 ||
          activeSession.version === 4) &&
        activeSession.boardId
      ) {
        await deleteBoardSession(activeSession.boardId)
      }
      if (authSummary.isAuthenticated && authSummary.isSignupCompleted) {
        await deleteCurrentBoardSessions()
      }
      clearActiveBoardSession()
      setActiveSession(null)
      setStartDialogOpen(false)
      pushNewWalk()
    } catch (error) {
      console.warn('Unable to delete previous board session', error)
      setStartError('진행 중인 미션을 삭제하지 못했어요. 다시 시도해주세요.')
    } finally {
      setStartPending(false)
    }
  }

  function handleContinue() {
    if (!activeSession) return
    const qs = new URLSearchParams({
      mode: activeSession.mode,
      nickname: activeSession.nickname,
    })
    router.push(`/bingo?${qs.toString()}`)
  }

  async function handleClearSession() {
    if (clearPending) return
    const ok = window.confirm('진행 중인 산책 기록을 지울까요?')
    if (!ok) return
    setClearPending(true)
    try {
      if (
        (activeSession?.version === 2 ||
          activeSession?.version === 3 ||
          activeSession?.version === 4) &&
        activeSession.boardId
      ) {
        await deleteBoardSession(activeSession.boardId)
      }
      if (authSummary.isAuthenticated && authSummary.isSignupCompleted) {
        await deleteCurrentBoardSessions()
      }
      clearActiveBoardSession()
      setActiveSession(null)
    } catch (error) {
      console.warn('Unable to delete board session', error)
      window.alert('진행 중인 산책 기록을 지우지 못했어요. 다시 시도해주세요.')
    } finally {
      setClearPending(false)
    }
  }

  return (
    <AppShell maxWidth="tablet" panelClassName="bg-canvas pb-28 md:pb-0">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <IconButton icon={Menu} variant="ghost" aria-label="메뉴" />
        <p className="font-display text-[22px] font-bold leading-tight text-brand-primary">
          사뿐
        </p>
        <ThemeToggle compact />
      </header>

      <div className="grid flex-1 gap-5 px-4 pb-4 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] md:items-start md:gap-6 md:pb-6">
        <div className="flex flex-col gap-5">
          <HomeHero authSummary={authSummary} />
          <div className="hidden md:block">
            <SafetyList />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {activeSession && (
            <ContinueWalkPanel
              session={activeSession}
              onContinue={handleContinue}
              onClear={handleClearSession}
            />
          )}

          {showNicknameField && (
            <TextField
              id="nickname"
              label="닉네임"
              value={nickname}
              onBlur={() => persistLoginNickname()}
              onChange={(e) => handleNicknameChange(e.target.value)}
              maxLength={MAX_NICKNAME_LENGTH}
              showCounter
              hint={
                authSummary.isAuthenticated
                  ? '계정 닉네임으로 저장돼요'
                  : '이 브라우저에 기억해둘게요'
              }
              placeholder="예) 산책요정 주연"
              autoComplete="off"
            />
          )}

          <section className="flex flex-col gap-3" aria-label="모드 선택">
            {authSummary.isAuthenticated && authSummary.isSignupCompleted && (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => router.push('/walks')}
              >
                내 산책 기록 보기
              </Button>
            )}
            <ModeCard
              icon={Clapperboard}
              title="미션 모드"
              description="추천 미션으로 바로 시작"
              selected={boardKind === 'mission'}
              size={modeByKind.mission}
              onSelect={() => setBoardKind('mission')}
              onSizeChange={(nextMode) =>
                setModeByKind((prev) => ({ ...prev, mission: nextMode }))
              }
            />
            <ModeCard
              icon={Edit3}
              title="커스텀 모드"
              description="이름과 설명을 직접 작성"
              selected={boardKind === 'custom'}
              size={modeByKind.custom}
              onSelect={() => setBoardKind('custom')}
              onSizeChange={(nextMode) =>
                setModeByKind((prev) => ({ ...prev, custom: nextMode }))
              }
            />
          </section>

          <div className="md:hidden">
            <SafetyList />
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-ink-100 bg-paper px-4 pb-8 pt-4 md:static md:ml-auto md:mr-4 md:w-[380px] md:max-w-none md:translate-x-0 md:border-t-0 md:bg-transparent md:px-0 md:pb-6 md:pt-0">
        <Button fullWidth size="lg" disabled={!canStart} onClick={handleStart}>
          빙고 만들기
        </Button>
      </footer>

      {startDialogOpen && (
        <ActionDialog
          title="진행 중인 미션이 있어요"
          description="진행중인 미션이 있는 경우 진행중이 새로운 미션을 시작할 경우 삭제 됩니다."
          error={startError}
          isPending={startPending}
          pendingLabel="새로 시작 중"
          onClose={() => setStartDialogOpen(false)}
          actions={[
            {
              label: '새로하기',
              onClick: handleConfirmNewStart,
            },
            {
              label: '취소',
              onClick: () => setStartDialogOpen(false),
              variant: 'tertiary',
            },
          ]}
        />
      )}
    </AppShell>
  )
}

interface ContinueWalkPanelProps {
  session: PersistedBoardSession
  onContinue: () => void
  onClear: () => void
}

function ContinueWalkPanel({
  session,
  onContinue,
  onClear,
}: ContinueWalkPanelProps) {
  const total = session.cellIds.length
  const completed =
    session.markedPositions.length +
    (session.version === 3 || session.version === 4
      ? session.clips.length
      : session.version === 2
        ? session.photos.length
        : 0)
  const sessionTitle = session.version === 4 ? session.title : session.nickname
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(session.updatedAt))

  return (
    <section
      aria-label="진행 중인 산책"
      className="flex flex-col gap-3 rounded-lg border border-brand-primary/30 bg-brand-primary-soft p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <Clock3 size={20} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-[length:var(--text-body-1)] font-semibold leading-normal text-ink-900">
            진행 중인 산책이 있어요
          </p>
          <p className="text-[length:var(--text-caption)] leading-normal text-ink-700">
            {`${boardSummaryLabel(
              session.version === 4 ? session.boardKind : 'mission',
              session.mode,
            )} · ${sessionTitle} · ${completed}/${total} · ${dateLabel}`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button size="md" onClick={onContinue}>
          이어하기
        </Button>
        <Button
          size="md"
          variant="tertiary"
          onClick={onClear}
          aria-label="진행 중인 산책 지우기"
          className="px-4"
        >
          지우기
        </Button>
      </div>
    </section>
  )
}

interface ModeCardProps {
  icon: typeof Clapperboard
  title: string
  description: string
  selected: boolean
  size: Extract<BoardMode, '5x5' | '3x3'>
  onSelect: () => void
  onSizeChange: (size: Extract<BoardMode, '5x5' | '3x3'>) => void
}

function ModeCard({
  icon: Icon,
  title,
  description,
  selected,
  size,
  onSelect,
  onSizeChange,
}: ModeCardProps) {
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
          <Icon size={24} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[length:var(--text-body-1)] font-semibold leading-normal text-ink-900">
            {title}
          </span>
          <span className="text-[length:var(--text-caption)] leading-normal text-ink-700">
            {description} · 3초 클립
          </span>
        </span>
        {selected && <Badge label="선택됨" />}
      </button>

      <div className="flex items-center gap-2" aria-label={`${title} 판 크기`}>
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
