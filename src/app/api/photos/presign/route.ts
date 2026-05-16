import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import {
  GUEST_SESSION_COOKIE_NAME,
} from '@/lib/storage/photos'
import {
  guestCookieOptions,
  preparePhotoUpload,
} from '@/lib/photos/server'
import { presignPhotoUploadSchema } from '@/lib/photos/validation'
import { createClient } from '@/lib/supabase/server'

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  )
}

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

  const parsed = presignPhotoUploadSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError('Invalid photo upload request.')
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const existingGuestSessionId = request.cookies.get(
    GUEST_SESSION_COOKIE_NAME,
  )?.value
  const guestSessionId = isUuid(existingGuestSessionId)
    ? existingGuestSessionId
    : crypto.randomUUID()

  try {
    const upload = await preparePhotoUpload({
      input: parsed.data,
      user,
      guestSessionId,
    })
    const response = NextResponse.json(upload)

    if (!user && !isUuid(existingGuestSessionId)) {
      response.cookies.set(
        GUEST_SESSION_COOKIE_NAME,
        guestSessionId,
        guestCookieOptions(),
      )
    }

    return response
  } catch (error) {
    console.warn('Failed to prepare photo upload.', error)
    return jsonError('Failed to prepare photo upload.', 500)
  }
}
