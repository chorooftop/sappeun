import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountClient } from '@/components/account/AccountClient'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { getCurrentAuthState } from '@/lib/auth/session'

export default async function AccountPage() {
  const authState = await getCurrentAuthState()
  if (!authState.user || !authState.profile?.signupCompletedAt) {
    redirect(`/login?${new URLSearchParams({ next: '/account' }).toString()}`)
  }

  return (
    <AppShell maxWidth="mobile" panelClassName="bg-canvas">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <Link
          href="/"
          aria-label="홈으로"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 hover:bg-ink-100"
        >
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <p className="font-display text-[20px] font-bold text-brand-primary">
          계정 연결
        </p>
        <ThemeToggle compact />
      </header>
      <AccountClient
        nickname={authState.profile.nickname}
        displayName={authState.profile.displayName}
      />
    </AppShell>
  )
}
