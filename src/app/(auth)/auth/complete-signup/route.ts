import { NextResponse, type NextRequest } from 'next/server'
import { completeSignup } from '@/lib/auth/profile'
import {
  getSafeNextPath,
  getSignupCompleteUrl,
  getSignupUrl,
} from '@/lib/auth/redirect'
import { guestCookieOptions, promoteGuestPhotosForUser } from '@/lib/photos/server'
import { createClient } from '@/lib/supabase/server'
import { GUEST_SESSION_COOKIE_NAME } from '@/lib/storage/photos'

const POST_REDIRECT_STATUS = 303

function hasAcceptedRequiredConsents(formData: FormData) {
  return (
    formData.get('terms') === 'accepted' &&
    formData.get('privacy') === 'accepted'
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  return NextResponse.redirect(
    getSignupUrl(request, { error: 'consent_required', next: nextPath }),
  )
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const nextPath = getSafeNextPath(String(formData.get('next') ?? ''))

  if (!hasAcceptedRequiredConsents(formData)) {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'consent_required', next: nextPath }),
      POST_REDIRECT_STATUS,
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'login_required', next: nextPath }),
      POST_REDIRECT_STATUS,
    )
  }

  try {
    await completeSignup(supabase, user.id, { source: 'login_recovery' })
  } catch {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'signup_failed', next: nextPath }),
      POST_REDIRECT_STATUS,
    )
  }

  const response = NextResponse.redirect(
    getSignupCompleteUrl(request, { next: nextPath }),
    POST_REDIRECT_STATUS,
  )

  try {
    const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value
    const result = await promoteGuestPhotosForUser({
      userId: user.id,
      guestSessionId: guestSessionId ?? null,
    })

    if (result.promoted > 0) {
      response.cookies.set(GUEST_SESSION_COOKIE_NAME, '', {
        ...guestCookieOptions(),
        maxAge: 0,
      })
    }
  } catch (error) {
    console.warn('Failed to promote guest photos after signup completion.', error)
  }

  return response
}
