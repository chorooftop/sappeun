import Link from 'next/link'
import { Camera, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { getAuthProviderOptions } from '@/lib/auth/providers'
import { Button } from '@/components/ui'

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  callback_failed: '가입을 완료하지 못했어요. 다시 시도해주세요.',
  consent_required: '필수 동의 후 계정을 만들 수 있어요.',
  login_required: '가입을 마무리하려면 다시 로그인해주세요.',
  oauth_failed: '가입을 시작하지 못했어요. 잠시 후 다시 시도해주세요.',
  profile_prepare_failed: '계정 준비 중 문제가 생겼어요. 다시 시도해주세요.',
  provider_not_ready: '아직 사용할 수 없는 가입 방식이에요.',
  signup_failed: '가입 정보를 저장하지 못했어요. 다시 시도해주세요.',
}

const SIGNUP_REASON_MESSAGES: Record<string, string> = {
  signup_required: '계정 저장 기능을 사용하려면 가입을 마무리해주세요.',
}

interface SignupPanelProps {
  error?: string
  nextPath: string
  reason?: string
}

function signupProviderLabel(label: string) {
  return label.replace('계속하기', '시작하기')
}

function ErrorMessage({ error, reason }: Pick<SignupPanelProps, 'error' | 'reason'>) {
  const message =
    (error ? SIGNUP_ERROR_MESSAGES[error] : null) ??
    (reason ? SIGNUP_REASON_MESSAGES[reason] : null)

  if (!message) return null

  return (
    <p
      role="alert"
      className="rounded-md border border-danger/30 bg-brand-accent-soft px-3 py-2 text-[length:var(--text-body-2)] font-medium leading-normal text-danger"
    >
      {message}
    </p>
  )
}

function ConsentFields() {
  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-stroke-default bg-ink-50 p-3">
      <legend className="sr-only">필수 동의</legend>
      <label className="flex items-start gap-2 text-[length:var(--text-body-2)] font-semibold leading-normal text-ink-800">
        <input
          required
          type="checkbox"
          name="terms"
          value="accepted"
          className="mt-1 h-4 w-4 rounded border-ink-300 accent-brand-primary"
        />
        <span>서비스 이용약관 동의</span>
      </label>
      <label className="flex items-start gap-2 text-[length:var(--text-body-2)] font-semibold leading-normal text-ink-800">
        <input
          required
          type="checkbox"
          name="privacy"
          value="accepted"
          className="mt-1 h-4 w-4 rounded border-ink-300 accent-brand-primary"
        />
        <span>개인정보 수집 및 이용 동의</span>
      </label>
    </fieldset>
  )
}

export function SignupPanel({ error, nextPath, reason }: SignupPanelProps) {
  const providers = getAuthProviderOptions()

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-stroke-default bg-paper p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <ClipboardCheck size={23} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[length:var(--text-heading-2)] font-bold leading-tight text-ink-900">
            사뿐 계정을 만들어요
          </h1>
          <p className="text-[length:var(--text-body-2)] leading-normal text-ink-700">
            사진과 빙고 기록을 안전하게 보관할 수 있어요.
          </p>
        </div>
      </div>

      <ErrorMessage error={error} reason={reason} />

      {providers.length === 0 ? (
        <p className="rounded-md border border-stroke-default bg-ink-50 px-3 py-2 text-center text-[length:var(--text-body-2)] font-medium leading-normal text-ink-700">
          소셜 가입 설정을 준비 중이에요.
        </p>
      ) : (
        <form method="post" className="flex flex-col gap-3">
          <input type="hidden" name="next" value={nextPath} />
          <ConsentFields />
          <div className="flex flex-col gap-2">
            {providers.map((provider) => (
              <Button
                key={provider.id}
                type="submit"
                disabled={!provider.enabled}
                formAction={`/auth/sign-up/${provider.id}`}
                variant={provider.id === 'kakao' ? 'secondary' : 'primary'}
                fullWidth
                className="justify-start rounded-lg px-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-paper text-[length:var(--text-caption)] font-bold text-ink-900">
                  {provider.shortLabel}
                </span>
                <span className="min-w-0 flex-1 text-center">
                  {provider.enabled
                    ? signupProviderLabel(provider.label)
                    : `${signupProviderLabel(provider.label)} 준비 중`}
                </span>
              </Button>
            ))}
          </div>
        </form>
      )}

      <div className="flex flex-col gap-1">
        <Link
          href={`/login?${new URLSearchParams({ next: nextPath }).toString()}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg text-[length:var(--text-body-2)] font-semibold text-ink-700 hover:bg-ink-100"
        >
          이미 계정이 있나요? 로그인
        </Link>
        <Link
          href={nextPath}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-[length:var(--text-body-2)] font-semibold text-ink-700 hover:bg-ink-100"
        >
          <Camera size={18} aria-hidden />
          로그인 없이 계속하기
        </Link>
      </div>
    </section>
  )
}

interface SignupRequiredPanelProps {
  error?: string
  nextPath: string
  reason?: string
}

export function SignupRequiredPanel({
  error,
  nextPath,
  reason,
}: SignupRequiredPanelProps) {
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-stroke-default bg-paper p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <ShieldCheck size={23} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[length:var(--text-caption)] font-semibold leading-normal text-brand-primary">
            계정 연결됨
          </p>
          <h1 className="text-[length:var(--text-heading-2)] font-bold leading-tight text-ink-900">
            가입을 마무리해요
          </h1>
          <p className="text-[length:var(--text-body-2)] leading-normal text-ink-700">
            계정 저장 기능을 사용하려면 필수 동의가 필요해요.
          </p>
        </div>
      </div>

      <ErrorMessage error={error} reason={reason} />

      <form
        action="/auth/complete-signup"
        method="post"
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="next" value={nextPath} />
        <ConsentFields />
        <Button type="submit" fullWidth className="rounded-lg">
          동의하고 계속하기
        </Button>
      </form>

      <LogoutButton
        className="inline-flex min-h-11 items-center justify-center rounded-lg text-[length:var(--text-body-2)] font-semibold leading-normal text-ink-700 hover:bg-ink-100"
      >
        로그아웃
      </LogoutButton>
    </section>
  )
}

interface SignupCompletePanelProps {
  nextPath: string
}

export function SignupCompletePanel({ nextPath }: SignupCompletePanelProps) {
  const continueLabel = nextPath === '/' ? '산책 시작하기' : '계속하기'

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-stroke-default bg-paper p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-paper">
          <CheckCircle2 size={23} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[length:var(--text-caption)] font-semibold leading-normal text-brand-primary">
            가입 완료
          </p>
          <h1 className="text-[length:var(--text-heading-2)] font-bold leading-tight text-ink-900">
            사뿐에 오신 걸 환영해요
          </h1>
          <p className="text-[length:var(--text-body-2)] leading-normal text-ink-700">
            이제 산책 기록을 계정에 이어서 보관할 수 있어요.
          </p>
        </div>
      </div>

      <Link
        href={nextPath}
        className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand-primary px-6 py-3 text-[length:var(--text-body-1)] font-semibold leading-normal text-paper shadow-cell-glow hover:bg-brand-primary-hover"
      >
        {continueLabel}
      </Link>
    </section>
  )
}
