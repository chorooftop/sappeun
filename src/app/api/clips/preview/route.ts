import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClipPreviewUrls } from '@/lib/clips/server'
import { clipPreviewSchema } from '@/lib/clips/validation'
import { createClient } from '@/lib/supabase/server'
import { GUEST_SESSION_COOKIE_NAME } from '@/lib/storage/clips'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON body.')
  }

  const parsed = clipPreviewSchema.safeParse(body)
  if (!parsed.success) return jsonError('Invalid clip preview request.')

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    const clips = await createClipPreviewUrls({
      clips: parsed.data.clips,
      user,
      guestSessionId,
    })

    return NextResponse.json({ clips })
  } catch (error) {
    console.warn('Failed to create clip preview URLs.', error)
    return jsonError('Failed to create clip preview URLs.', 500)
  }
}
