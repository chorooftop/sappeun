import { NextResponse, type NextRequest } from 'next/server'
import { completeSignup } from '@/lib/auth/profile'
import {
  getSafeNextPath,
  getSignupCompleteUrl,
  getSignupUrl,
} from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

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
    )
  }

  try {
    await completeSignup(supabase, user.id, { source: 'login_recovery' })
  } catch {
    return NextResponse.redirect(
      getSignupUrl(request, { error: 'signup_failed', next: nextPath }),
    )
  }

  return NextResponse.redirect(getSignupCompleteUrl(request, { next: nextPath }))
}
