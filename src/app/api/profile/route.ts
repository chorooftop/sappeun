import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentAuthState, getCurrentUser } from '@/lib/auth/session'
import { isMissingColumnError } from '@/lib/supabase/errors'
import { createClient } from '@/lib/supabase/server'

const updateProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(10),
})

export async function GET() {
  const authState = await getCurrentAuthState()
  if (!authState.user) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  return NextResponse.json({
    profile: {
      nickname: authState.profile?.nickname ?? null,
      displayName: authState.profile?.displayName ?? null,
      avatarUrl: authState.profile?.avatarUrl ?? null,
      primaryProvider: authState.profile?.primaryProvider ?? null,
    },
  })
}

export async function PATCH(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile.' }, { status: 400 })
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  if (!user) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  const now = new Date().toISOString()
  let { error } = await supabase
    .from('profiles')
    .update({
      nickname: parsed.data.nickname,
      nickname_updated_at: now,
    })
    .eq('user_id', user.id)

  if (error && isMissingColumnError(error, ['nickname', 'nickname_updated_at'])) {
    ;({ error } = await supabase
      .from('profiles')
      .update({
        display_name: parsed.data.nickname,
        last_seen_at: now,
      })
      .eq('user_id', user.id))
  }

  if (error) {
    console.warn('Failed to update profile nickname.', error)
    return NextResponse.json(
      { error: 'Failed to update profile.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    profile: {
      nickname: parsed.data.nickname,
      nicknameUpdatedAt: now,
    },
  })
}
