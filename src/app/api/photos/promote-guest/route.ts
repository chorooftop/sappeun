import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { promoteGuestPhotosForUser, guestCookieOptions } from '@/lib/photos/server'
import { createClient } from '@/lib/supabase/server'
import { GUEST_SESSION_COOKIE_NAME } from '@/lib/storage/photos'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  if (!user) return jsonError('Authentication required.', 401)

  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    const result = await promoteGuestPhotosForUser({
      userId: user.id,
      guestSessionId,
    })
    const response = NextResponse.json(result)

    if (result.promoted > 0) {
      response.cookies.set(GUEST_SESSION_COOKIE_NAME, '', {
        ...guestCookieOptions(),
        maxAge: 0,
      })
    }

    return response
  } catch (error) {
    console.warn('Failed to promote guest photos.', error)
    return jsonError('Failed to promote guest photos.', 500)
  }
}
