import { NextResponse, type NextRequest } from 'next/server'
import { ensureUserProfile } from '@/lib/auth/profile'
import {
  getLocalRedirectUrl,
  getLoginUrl,
  getSafeNextPath,
} from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'callback_failed', next: nextPath }),
    )
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'callback_failed', next: nextPath }),
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'callback_failed', next: nextPath }),
    )
  }

  try {
    await ensureUserProfile(supabase, user)
  } catch {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      getLoginUrl(request, {
        error: 'profile_prepare_failed',
        next: nextPath,
      }),
    )
  }

  return NextResponse.redirect(getLocalRedirectUrl(request, nextPath))
}
