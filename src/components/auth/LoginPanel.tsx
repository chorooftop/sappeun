import Link from 'next/link'
import { Clapperboard, ShieldCheck } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { getAuthProviderOptions } from '@/lib/auth/providers'
import type { AuthProfileSummary } from '@/lib/auth/session'
import { Button } from '@/components/ui'

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: '로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.',
  callback_failed: '로그인을 완료하지 못했어요. 다시 시도해주세요.',
  profile_prepare_failed: '계정 준비 중 문제가 생겼어요. 다시 시도해주세요.',
  provider_not_ready: '아직 사용할 수 없는 로그인 방식이에요.',
  logout_failed: '로그아웃을 완료하지 못했어요.',
}

interface LoginPanelProps {
  nextPath: string
  error?: string
}

export function LoginPanel({ nextPath, error }: LoginPanelProps) {
  const errorMessage = error ? ERROR_MESSAGES[error] : null
  const providers = getAuthProviderOptions()

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-stroke-default bg-paper p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <ShieldCheck size={23} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[length:var(--text-heading-2)] font-bold leading-tight text-ink-900">
            산책 기록을 안전하게 보관해요
          </h1>
          <p className="text-[length:var(--text-body-2)] leading-normal text-ink-700">
            로그인하면 찍은 클립과 완성한 빙고를 내 계정에 저장할 수 있어요.
          </p>
        </div>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-brand-accent-soft px-3 py-2 text-[length:var(--text-body-2)] font-medium leading-normal text-danger"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {providers.length === 0 && (
          <p className="rounded-md border border-stroke-default bg-ink-50 px-3 py-2 text-center text-[length:var(--text-body-2)] font-medium leading-normal text-ink-700">
            소셜 로그인 설정을 준비 중이에요.
          </p>
        )}

        {providers.map((provider) => (
          <form
            key={provider.id}
            action={`/auth/sign-in/${provider.id}`}
            method="get"
          >
            <input type="hidden" name="next" value={nextPath} />
            <Button
              type="submit"
              disabled={!provider.enabled}
              variant={provider.id === 'kakao' ? 'secondary' : 'primary'}
              fullWidth
              className="justify-start rounded-lg px-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-paper text-[length:var(--text-caption)] font-bold text-ink-900">
                {provider.shortLabel}
              </span>
              <span className="min-w-0 flex-1 text-center">
                {provider.enabled ? provider.label : `${provider.label} 준비 중`}
              </span>
            </Button>
          </form>
        ))}
      </div>

      <Link
        href={nextPath}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-[length:var(--text-body-2)] font-semibold text-ink-700 hover:bg-ink-100"
      >
        <Clapperboard size={18} aria-hidden />
        로그인 없이 계속하기
      </Link>

      <Link
        href={`/signup?${new URLSearchParams({ next: nextPath }).toString()}`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg text-[length:var(--text-body-2)] font-semibold text-brand-primary hover:bg-brand-primary-soft"
      >
        처음이신가요? 계정 만들기
      </Link>
    </section>
  )
}

interface LoggedInPanelProps {
  authSummary: AuthProfileSummary
  nextPath: string
}

export function LoggedInPanel({ authSummary, nextPath }: LoggedInPanelProps) {
  const continueLabel = nextPath === '/' ? '홈으로 돌아가기' : '계속하기'
  const accountLabel = authSummary.displayName
    ? `${authSummary.displayName} 계정`
    : '계정 연결됨'

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-stroke-default bg-paper p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <ShieldCheck size={23} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[length:var(--text-caption)] font-semibold leading-normal text-brand-primary">
            {accountLabel}
          </p>
          <h1 className="text-[length:var(--text-heading-2)] font-bold leading-tight text-ink-900">
            이미 계정이 연결되어 있어요
          </h1>
          <p className="text-[length:var(--text-body-2)] leading-normal text-ink-700">
            이 산책 기록을 계정에 이어서 저장할 준비가 됐어요.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href={nextPath}
          className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand-primary px-6 py-3 text-[length:var(--text-body-1)] font-semibold leading-normal text-paper shadow-cell-glow hover:bg-brand-primary-hover"
        >
          {continueLabel}
        </Link>
        <LogoutButton
          className="inline-flex min-h-11 items-center justify-center rounded-lg text-[length:var(--text-body-2)] font-semibold leading-normal text-ink-700 hover:bg-ink-100"
        >
          로그아웃
        </LogoutButton>
      </div>
    </section>
  )
}
