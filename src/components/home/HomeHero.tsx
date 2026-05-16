import { Footprints } from 'lucide-react'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'
import type { AuthProfileSummary } from '@/lib/auth/session'

interface HomeHeroProps {
  authSummary: AuthProfileSummary
}

export function HomeHero({ authSummary }: HomeHeroProps) {
  const profileName = authSummary.nickname ?? authSummary.displayName
  const accountLabel = profileName
    ? `${profileName} 계정 연결됨`
    : '계정 연결됨'
  const signupHref = `/signup?${new URLSearchParams({ next: '/' }).toString()}`

  return (
    <section className="flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-lg bg-brand-primary-soft px-4 py-5 text-center">
      <Footprints
        size={56}
        strokeWidth={2}
        className="text-brand-primary"
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--text-body-1)] font-semibold leading-normal text-ink-900">
          산책길에서 빙고를 찾아요
        </h1>
        <p className="text-[length:var(--text-caption)] leading-normal text-ink-700">
          오늘 만난 사물로 빙고판을 채워보세요
        </p>
      </div>

      <div className="flex max-w-full flex-wrap items-center justify-center gap-2 text-[length:var(--text-caption)] font-semibold leading-normal">
        {authSummary.isAuthenticated && authSummary.isSignupCompleted ? (
          <>
            <span className="rounded-pill bg-paper px-3 py-1 text-brand-primary">
              {accountLabel}
            </span>
            <Link
              href="/account"
              className="rounded-pill px-3 py-1 text-ink-700 hover:bg-paper"
            >
              계정
            </Link>
            <LogoutButton
              className="rounded-pill px-3 py-1 text-ink-700 hover:bg-paper"
            >
              로그아웃
            </LogoutButton>
          </>
        ) : authSummary.isAuthenticated ? (
          <>
            <span className="rounded-pill bg-paper px-3 py-1 text-warning">
              가입 마무리 필요
            </span>
            <Link
              href={signupHref}
              className="rounded-pill px-3 py-1 text-brand-primary hover:bg-paper"
            >
              가입 마무리
            </Link>
          </>
        ) : (
          <>
            <Link
              href={signupHref}
              className="rounded-pill bg-paper px-3 py-1 text-brand-primary hover:bg-brand-primary hover:text-paper"
            >
              계정 만들기
            </Link>
            <Link
              href="/login"
              className="rounded-pill px-3 py-1 text-ink-700 hover:bg-paper"
            >
              로그인
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
