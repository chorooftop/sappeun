import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import {
  KAKAO_AUTH_STATE_COOKIE_NAME,
  exchangeKakaoCodeForToken,
} from '@/lib/auth/kakao'
import { completeSignup, ensureUserProfile } from '@/lib/auth/profile'
import {
  AUTH_FLOW_COOKIE_NAME,
  AUTH_FLOW_SIGNUP_VALUE,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  SIGNUP_INTENT_ACCEPTED_VALUE,
  SIGNUP_INTENT_COOKIE_NAME,
  getLocalRedirectUrl,
  getLoginUrl,
  getSafeNextPath,
  getSignupCompleteUrl,
  getSignupUrl,
} from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

const AUTH_FLOW_COOKIE_NAMES = [
  AUTH_NEXT_COOKIE_NAME,
  AUTH_FLOW_COOKIE_NAME,
  SIGNUP_INTENT_COOKIE_NAME,
  KAKAO_AUTH_STATE_COOKIE_NAME,
] as const

function clearAuthFlowCookies(response: NextResponse) {
  AUTH_FLOW_COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: AUTH_NEXT_COOKIE_PATH,
    })
  })
  return response
}

function redirectToLogin(request: NextRequest, error: string, nextPath: string) {
  return clearAuthFlowCookies(
    NextResponse.redirect(getLoginUrl(request, { error, next: nextPath })),
  )
}

function redirectToSignup(
  request: NextRequest,
  params: {
    error?: string
    nextPath: string
    reason?: string
  },
) {
  return clearAuthFlowCookies(
    NextResponse.redirect(
      getSignupUrl(request, {
        error: params.error,
        next: params.nextPath,
        reason: params.reason,
      }),
    ),
  )
}

function redirectToAuthEntry(
  request: NextRequest,
  authFlow: string | undefined,
  error: string,
  nextPath: string,
) {
  if (authFlow === AUTH_FLOW_SIGNUP_VALUE) {
    return redirectToSignup(request, { error, nextPath })
  }

  return redirectToLogin(request, error, nextPath)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const cookieStore = await cookies()
  const authFlow = cookieStore.get(AUTH_FLOW_COOKIE_NAME)?.value
  const signupIntent = cookieStore.get(SIGNUP_INTENT_COOKIE_NAME)?.value
  const expectedState = cookieStore.get(KAKAO_AUTH_STATE_COOKIE_NAME)?.value
  const nextPath = getSafeNextPath(cookieStore.get(AUTH_NEXT_COOKIE_NAME)?.value)

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToAuthEntry(request, authFlow, 'callback_failed', nextPath)
  }

  const supabase = await createClient()

  try {
    const token = await exchangeKakaoCodeForToken(request, code)
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'kakao',
      token: token.id_token!,
    })

    if (error) {
      return redirectToAuthEntry(request, authFlow, 'callback_failed', nextPath)
    }
  } catch {
    return redirectToAuthEntry(request, authFlow, 'callback_failed', nextPath)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return redirectToAuthEntry(request, authFlow, 'callback_failed', nextPath)
  }

  let profileResult
  try {
    profileResult = await ensureUserProfile(supabase, user)
  } catch {
    await supabase.auth.signOut()
    return redirectToAuthEntry(
      request,
      authFlow,
      'profile_prepare_failed',
      nextPath,
    )
  }

  if (authFlow === AUTH_FLOW_SIGNUP_VALUE) {
    if (profileResult.signupCompletedAt) {
      return clearAuthFlowCookies(
        NextResponse.redirect(getLocalRedirectUrl(request, nextPath)),
      )
    }

    if (signupIntent !== SIGNUP_INTENT_ACCEPTED_VALUE) {
      return redirectToSignup(request, {
        error: 'consent_required',
        nextPath,
      })
    }

    try {
      await completeSignup(supabase, user.id, { source: 'signup' })
    } catch {
      return redirectToSignup(request, { error: 'signup_failed', nextPath })
    }

    return clearAuthFlowCookies(
      NextResponse.redirect(getSignupCompleteUrl(request, { next: nextPath })),
    )
  }

  if (!profileResult.signupCompletedAt) {
    return redirectToSignup(request, {
      nextPath,
      reason: 'signup_required',
    })
  }

  return clearAuthFlowCookies(
    NextResponse.redirect(getLocalRedirectUrl(request, nextPath)),
  )
}
