import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { LoginPanel } from '@/components/auth/LoginPanel'
import { AppShell } from '@/components/layout/AppShell'
import { getSafeNextPath } from '@/lib/auth/redirect'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const nextPath = getSafeNextPath(firstSearchParam(params.next))
  const error = firstSearchParam(params.error)

  return (
    <AppShell maxWidth="mobile" panelClassName="bg-canvas">
      <header className="flex h-12 shrink-0 items-center justify-between bg-paper px-4">
        <Link
          href="/"
          aria-label="홈으로"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-700 hover:bg-ink-100"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <p className="font-display text-[22px] font-bold leading-tight text-brand-primary">
          사뿐
        </p>
        <span aria-hidden className="h-10 w-10" />
      </header>

      <div className="flex flex-1 items-center px-4 py-6">
        <LoginPanel nextPath={nextPath} error={error} />
      </div>
    </AppShell>
  )
}
