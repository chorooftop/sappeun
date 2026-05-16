import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { deleteClip, updateClipDescription } from '@/lib/clips/server'
import {
  clipOwnerKindSchema,
  updateClipDescriptionSchema,
} from '@/lib/clips/validation'
import { createClient } from '@/lib/supabase/server'
import { GUEST_SESSION_COOKIE_NAME } from '@/lib/storage/clips'

interface RouteContext {
  params: Promise<{ clipId: string }>
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { clipId } = await context.params
  const requestUrl = new URL(request.url)
  const ownerKind = clipOwnerKindSchema.safeParse(
    requestUrl.searchParams.get('ownerKind'),
  )

  if (!ownerKind.success) return jsonError('Invalid clip owner kind.')

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    await deleteClip({
      clipId,
      ownerKind: ownerKind.data,
      user,
      guestSessionId,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.warn('Failed to delete clip.', error)
    return jsonError('Failed to delete clip.', 500)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { clipId } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON body.')
  }

  const parsed = updateClipDescriptionSchema.safeParse(body)
  if (!parsed.success) return jsonError('Invalid clip update request.')

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const guestSessionId = request.cookies.get(GUEST_SESSION_COOKIE_NAME)?.value ?? null

  try {
    await updateClipDescription({
      clipId,
      ownerKind: parsed.data.ownerKind,
      description: parsed.data.description?.trim() || undefined,
      boardSnapshot: parsed.data.boardSnapshot,
      user,
      guestSessionId,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.warn('Failed to update clip.', error)
    return jsonError('Failed to update clip.', 500)
  }
}
