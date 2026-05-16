import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { confirmPhotoUpload } from '@/lib/photos/server'
import { confirmPhotoUploadSchema } from '@/lib/photos/validation'
import { createClient } from '@/lib/supabase/server'
import { GUEST_SESSION_COOKIE_NAME } from '@/lib/storage/photos'

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

  const parsed = confirmPhotoUploadSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError('Invalid photo confirmation request.')
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    return NextResponse.json(
      await confirmPhotoUpload({
        photoId: parsed.data.photoId,
        ownerKind: parsed.data.ownerKind,
        user,
        guestSessionId,
      }),
    )
  } catch (error) {
    console.warn('Failed to confirm photo upload.', error)
    return jsonError('Failed to confirm photo upload.', 500)
  }
}
