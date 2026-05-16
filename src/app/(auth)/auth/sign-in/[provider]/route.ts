import { NextResponse, type NextRequest } from 'next/server'
import {
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  getAuthCallbackUrl,
  getLoginUrl,
  getSafeNextPath,
} from '@/lib/auth/redirect'
import { getAuthProvider } from '@/lib/auth/providers'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params
  const authProvider = getAuthProvider(providerId)
  const requestUrl = new URL(request.url)
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  if (!authProvider) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'provider_not_ready', next: nextPath }),
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: authProvider.provider,
    options: {
      redirectTo: getAuthCallbackUrl(request),
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'oauth_failed', next: nextPath }),
    )
  }

  const response = NextResponse.redirect(data.url)
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, nextPath, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: AUTH_NEXT_COOKIE_PATH,
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'development',
  })
  return response
}

export const POST = GET
