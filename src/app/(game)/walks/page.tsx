import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { WalksClient } from '@/components/walks/WalksClient'
import { getCurrentAuthState } from '@/lib/auth/session'
import { listUserBoards } from '@/lib/boards/server'

export default async function WalksPage() {
  const authState = await getCurrentAuthState()
  if (!authState.user || !authState.profile?.signupCompletedAt) {
    redirect(`/login?${new URLSearchParams({ next: '/walks' }).toString()}`)
  }

  const boards = await listUserBoards(authState.user.id)

  return (
    <AppShell maxWidth="tablet" panelClassName="bg-canvas">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <Link
          href="/"
          aria-label="홈으로"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-900 hover:bg-ink-100"
        >
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <p className="font-display text-[20px] font-bold text-brand-primary">
          산책 기록
        </p>
        <ThemeToggle compact />
      </header>

      <section className="flex flex-1 flex-col gap-3 px-4 py-5">
        <WalksClient initialBoards={boards} />
      </section>
    </AppShell>
  )
}
