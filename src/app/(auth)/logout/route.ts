import { NextResponse, type NextRequest } from 'next/server'
import { getLocalRedirectUrl, getSafeNextPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))
  const supabase = await createClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(getLocalRedirectUrl(request, nextPath))
}

export const POST = GET
