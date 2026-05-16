import { NextResponse, type NextRequest } from 'next/server'
import {
  AUTH_FLOW_COOKIE_NAME,
  AUTH_FLOW_LOGIN_VALUE,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  SIGNUP_INTENT_COOKIE_NAME,
  getAuthCallbackUrl,
  getLoginUrl,
  getSafeNextPath,
} from '@/lib/auth/redirect'
import { getAuthProvider } from '@/lib/auth/providers'
import {
  KAKAO_AUTH_NONCE_COOKIE_NAME,
  KAKAO_AUTH_STATE_COOKIE_NAME,
  createKakaoOAuthValue,
  getKakaoAuthorizeUrl,
} from '@/lib/auth/kakao'
import { createClient } from '@/lib/supabase/server'

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
  const nonce = createKakaoOAuthValue()
  const url = getKakaoAuthorizeUrl(request, { nonce, state })

  if (!url) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'oauth_failed', next: nextPath }),
    )
  }

  const response = NextResponse.redirect(url)
  const cookieOptions = authCookieOptions()
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, nextPath, cookieOptions)
  response.cookies.set(AUTH_FLOW_COOKIE_NAME, AUTH_FLOW_LOGIN_VALUE, cookieOptions)
  response.cookies.set(KAKAO_AUTH_STATE_COOKIE_NAME, state, cookieOptions)
  response.cookies.set(KAKAO_AUTH_NONCE_COOKIE_NAME, nonce, cookieOptions)
  response.cookies.set(SIGNUP_INTENT_COOKIE_NAME, '', {
    maxAge: 0,
    path: AUTH_NEXT_COOKIE_PATH,
  })
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

  if (!authProvider) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'provider_not_ready', next: nextPath }),
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
      getLoginUrl(request, { error: 'oauth_failed', next: nextPath }),
    )
  }

  const response = NextResponse.redirect(data.url)
  const cookieOptions = authCookieOptions()
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, nextPath, cookieOptions)
  response.cookies.set(AUTH_FLOW_COOKIE_NAME, AUTH_FLOW_LOGIN_VALUE, cookieOptions)
  response.cookies.set(SIGNUP_INTENT_COOKIE_NAME, '', {
    maxAge: 0,
    path: AUTH_NEXT_COOKIE_PATH,
  })
  return response
}

export const POST = GET
