import { NextResponse, type NextRequest } from 'next/server'
import {
  AUTH_FLOW_COOKIE_NAME,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_NEXT_COOKIE_PATH,
  SIGNUP_INTENT_COOKIE_NAME,
  getLocalRedirectUrl,
  getSafeNextPath,
} from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

const AUTH_FLOW_COOKIE_NAMES = [
  AUTH_NEXT_COOKIE_NAME,
  AUTH_FLOW_COOKIE_NAME,
  SIGNUP_INTENT_COOKIE_NAME,
] as const

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))
  const supabase = await createClient()

  await supabase.auth.signOut()

  const response = NextResponse.redirect(getLocalRedirectUrl(request, nextPath))
  AUTH_FLOW_COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: AUTH_NEXT_COOKIE_PATH,
    })
  })

  return response
}

export const POST = GET
