'use client'

import { Link2, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, TextField } from '@/components/ui'
import { updateProfileNickname } from '@/lib/boards/client'
import { createClient } from '@/lib/supabase/client'

interface AccountClientProps {
  nickname: string | null
  displayName: string | null
}

interface IdentitySummary {
  provider: string
  identityId: string
}

const MAX_NICKNAME_LENGTH = 10

export function AccountClient({ nickname, displayName }: AccountClientProps) {
  const initialNickname = nickname ?? displayName ?? ''
  const [nicknameValue, setNicknameValue] = useState(initialNickname)
  const [identities, setIdentities] = useState<IdentitySummary[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [isSavingNickname, setIsSavingNickname] = useState(false)
  const [savedNickname, setSavedNickname] = useState(initialNickname)
  const supabase = useMemo(() => createClient(), [])
  const linkedProviders = new Set(identities.map((identity) => identity.provider))
  const trimmedNickname = nicknameValue.trim()
  const canSaveNickname =
    trimmedNickname.length > 0 &&
    trimmedNickname.length <= MAX_NICKNAME_LENGTH &&
    trimmedNickname !== savedNickname

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getUserIdentities().then(({ data, error }) => {
      if (cancelled) return
      if (error || !data) {
        setStatus('연결된 로그인 정보를 불러오지 못했어요.')
        return
      }

      setIdentities(
        data.identities.map((identity) => ({
          provider: identity.provider,
          identityId: identity.id,
        })),
      )
    })

    return () => {
      cancelled = true
    }
  }, [supabase])

  async function linkGoogle() {
    setStatus('Google 연결 화면으로 이동하고 있어요.')
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    })

    if (error) {
      setStatus('Google 연결을 시작하지 못했어요.')
      return
    }

    if (data.url) {
      window.location.assign(data.url)
    }
  }

  async function saveNickname() {
    if (!canSaveNickname) return
    setIsSavingNickname(true)
    setStatus(null)

    try {
      await updateProfileNickname(trimmedNickname)
      setSavedNickname(trimmedNickname)
      setNicknameValue(trimmedNickname)
      setStatus('닉네임을 저장했어요.')
    } catch {
      setStatus('닉네임 저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSavingNickname(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 px-4 py-5">
      <div className="rounded-lg bg-brand-primary-soft p-4">
        <p className="text-[length:var(--text-caption)] font-semibold text-brand-primary">
          현재 계정
        </p>
        <p className="mt-1 text-[length:var(--text-title)] font-semibold text-ink-900">
          {savedNickname || displayName || '사뿐 사용자'}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ink-100 bg-paper p-4 shadow-card">
        <TextField
          id="account-nickname"
          label="닉네임"
          value={nicknameValue}
          maxLength={MAX_NICKNAME_LENGTH}
          showCounter
          hint="산책 기록과 새 빙고판에 표시돼요"
          placeholder="예) 산책요정 주연"
          autoComplete="off"
          onChange={(event) => setNicknameValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void saveNickname()
            }
          }}
        />
        <Button
          size="md"
          fullWidth
          disabled={!canSaveNickname || isSavingNickname}
          onClick={() => void saveNickname()}
        >
          <Save size={18} aria-hidden />
          {isSavingNickname ? '저장 중' : '닉네임 저장'}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <ProviderRow
          provider="google"
          label="Google"
          linked={linkedProviders.has('google')}
          onLink={linkGoogle}
        />
        <ProviderRow
          provider="kakao"
          label="카카오톡"
          linked={linkedProviders.has('kakao')}
          disabled
          note="현재 카카오는 custom OIDC 로그인이라 연결 전략 확정 후 열어요."
        />
      </div>

      {status && (
        <p role="status" className="text-[length:var(--text-caption)] text-ink-500">
          {status}
        </p>
      )}
    </section>
  )
}

interface ProviderRowProps {
  provider: string
  label: string
  linked: boolean
  disabled?: boolean
  note?: string
  onLink?: () => void
}

function ProviderRow({
  provider,
  label,
  linked,
  disabled = false,
  note,
  onLink,
}: ProviderRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink-100 bg-paper p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink-50 text-ink-700">
            {linked ? (
              <ShieldCheck size={20} aria-hidden />
            ) : (
              <Link2 size={20} aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[length:var(--text-body-1)] font-semibold text-ink-900">
              {label}
            </p>
            <p className="text-[length:var(--text-caption)] text-ink-500">
              {linked ? '이 계정에 연결됨' : note ?? '아직 연결되지 않음'}
            </p>
          </div>
        </div>
        <span className="rounded-pill bg-ink-50 px-3 py-1 text-[length:var(--text-caption)] font-semibold text-ink-500">
          {provider}
        </span>
      </div>
      {!linked && (
        <Button
          variant="secondary"
          size="md"
          disabled={disabled}
          onClick={onLink}
          fullWidth
        >
          {label} 연결
        </Button>
      )}
    </div>
  )
}
