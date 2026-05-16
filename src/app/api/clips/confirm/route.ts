import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { confirmClipUpload, getClipSchemaErrorMessage } from '@/lib/clips/server'
import { confirmClipUploadSchema } from '@/lib/clips/validation'
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

  const parsed = confirmClipUploadSchema.safeParse(body)
  if (!parsed.success) return jsonError('Invalid clip confirmation request.')

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    return NextResponse.json(
      await confirmClipUpload({
        clipId: parsed.data.clipId,
        ownerKind: parsed.data.ownerKind,
        user,
        guestSessionId,
      }),
    )
  } catch (error) {
    console.warn('Failed to confirm clip upload.', error)
    return jsonError(
      getClipSchemaErrorMessage(error) ?? 'Failed to confirm clip upload.',
      500,
    )
  }
}
