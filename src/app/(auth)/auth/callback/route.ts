import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { ensureUserProfile } from '@/lib/auth/profile'
import {
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  getLocalRedirectUrl,
  getLoginUrl,
  getSafeNextPath,
} from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

function clearAuthNextCookie(response: NextResponse) {
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, '', {
    maxAge: 0,
    path: AUTH_NEXT_COOKIE_PATH,
  })
  return response
}

function redirectToLogin(request: NextRequest, error: string, nextPath: string) {
  return clearAuthNextCookie(
    NextResponse.redirect(getLoginUrl(request, { error, next: nextPath })),
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = await cookies()
  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get('next') ??
      cookieStore.get(AUTH_NEXT_COOKIE_NAME)?.value,
  )

  if (!code) {
    return redirectToLogin(request, 'callback_failed', nextPath)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return redirectToLogin(request, 'callback_failed', nextPath)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return redirectToLogin(request, 'callback_failed', nextPath)
  }

  try {
    await ensureUserProfile(supabase, user)
  } catch {
    await supabase.auth.signOut()
    return redirectToLogin(request, 'profile_prepare_failed', nextPath)
  }

  return clearAuthNextCookie(
    NextResponse.redirect(getLocalRedirectUrl(request, nextPath)),
  )
}
