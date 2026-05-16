import { NextResponse, type NextRequest } from 'next/server'
import {
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
      redirectTo: getAuthCallbackUrl(request, nextPath),
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      getLoginUrl(request, { error: 'oauth_failed', next: nextPath }),
    )
  }

  return NextResponse.redirect(data.url)
}

export const POST = GET
