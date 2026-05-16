import { NextResponse, type NextRequest } from 'next/server'
import { cleanupExpiredGuestClips } from '@/lib/clips/server'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true

  const requestUrl = new URL(request.url)
  return requestUrl.searchParams.get('secret') === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    return NextResponse.json(await cleanupExpiredGuestClips())
  } catch (error) {
    console.warn('Failed to cleanup temp clips.', error)
    return NextResponse.json(
      { error: 'Failed to cleanup temp clips.' },
      { status: 500 },
    )
  }
}
