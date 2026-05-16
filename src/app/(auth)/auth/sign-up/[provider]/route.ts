import { NextResponse, type NextRequest } from 'next/server'
import {
  AUTH_FLOW_COOKIE_NAME,
  AUTH_FLOW_SIGNUP_VALUE,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  SIGNUP_INTENT_ACCEPTED_VALUE,
  SIGNUP_INTENT_COOKIE_NAME,
  getAuthCallbackUrl,
  getSignupUrl,
  getSafeNextPath,
} from '@/lib/auth/redirect'
import { getAuthProvider } from '@/lib/auth/providers'
import {
  KAKAO_AUTH_STATE_COOKIE_NAME,
  createKakaoOAuthValue,
  getKakaoAuthorizeUrl,
} from '@/lib/auth/kakao'
import { createClient } from '@/lib/supabase/server'

function hasAcceptedRequiredConsents(formData: FormData) {
  return (
    formData.get('terms') === 'accepted' &&
    formData.get('privacy') === 'accepted'
  )
}

function authCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 10,
    path: AUTH_NEXT_COOKIE_PATH,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV !== 'development',
  }
}

function redirectToKakao(request: NextRequest, nextPath: string) {
  const state = createKakaoOAuthValue()
  const url = getKakaoAuthorizeUrl(request, { state })

  if (!url) {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'oauth_failed', next: nextPath }),
    )
  }

  const response = NextResponse.redirect(url)
  const cookieOptions = authCookieOptions()
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, nextPath, cookieOptions)
  response.cookies.set(
    AUTH_FLOW_COOKIE_NAME,
    AUTH_FLOW_SIGNUP_VALUE,
    cookieOptions,
  )
  response.cookies.set(
    SIGNUP_INTENT_COOKIE_NAME,
    SIGNUP_INTENT_ACCEPTED_VALUE,
    cookieOptions,
  )
  response.cookies.set(KAKAO_AUTH_STATE_COOKIE_NAME, state, cookieOptions)
  return response
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params
  const authProvider = getAuthProvider(providerId)
  const requestUrl = new URL(request.url)
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  return NextResponse.redirect(
    getSignupUrl(request, {
      error: authProvider ? 'consent_required' : 'provider_not_ready',
      next: nextPath,
    }),
  )
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params
  const authProvider = getAuthProvider(providerId)
  const formData = await request.formData()
  const nextPath = getSafeNextPath(String(formData.get('next') ?? ''))

  if (!authProvider) {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'provider_not_ready', next: nextPath }),
    )
  }

  if (!hasAcceptedRequiredConsents(formData)) {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'consent_required', next: nextPath }),
    )
  }

  if (authProvider.id === 'kakao') {
    return redirectToKakao(request, nextPath)
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
      getSignupUrl(request, { error: 'oauth_failed', next: nextPath }),
    )
  }

  const response = NextResponse.redirect(data.url)
  const cookieOptions = authCookieOptions()
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, nextPath, cookieOptions)
  response.cookies.set(
    AUTH_FLOW_COOKIE_NAME,
    AUTH_FLOW_SIGNUP_VALUE,
    cookieOptions,
  )
  response.cookies.set(
    SIGNUP_INTENT_COOKIE_NAME,
    SIGNUP_INTENT_ACCEPTED_VALUE,
    cookieOptions,
  )
  return response
}
