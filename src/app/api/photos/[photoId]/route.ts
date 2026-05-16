import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { deletePhoto } from '@/lib/photos/server'
import { photoOwnerKindSchema } from '@/lib/photos/validation'
import { createClient } from '@/lib/supabase/server'
import { GUEST_SESSION_COOKIE_NAME } from '@/lib/storage/photos'

interface RouteContext {
  params: Promise<{ photoId: string }>
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { photoId } = await context.params
  const requestUrl = new URL(request.url)
  const ownerKind = photoOwnerKindSchema.safeParse(
    requestUrl.searchParams.get('ownerKind'),
  )

  if (!ownerKind.success) {
    return jsonError('Invalid photo owner kind.')
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    await deletePhoto({
      photoId,
      ownerKind: ownerKind.data,
      user,
      guestSessionId,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.warn('Failed to delete photo.', error)
    return jsonError('Failed to delete photo.', 500)
  }
}
