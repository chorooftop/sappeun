import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { deleteActiveUserBoards } from '@/lib/boards/server'
import { getLatestUserBoardSession } from '@/lib/photos/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ session: null }, { status: 401 })
  }

  try {
    return NextResponse.json({
      session: await getLatestUserBoardSession(user.id),
    })
  } catch (error) {
    console.warn('Failed to load active board session.', error)
    return NextResponse.json(
      { error: 'Failed to load active board session.' },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    await deleteActiveUserBoards(user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.warn('Failed to delete active boards.', error)
    return NextResponse.json(
      { error: 'Failed to delete active boards.' },
      { status: 500 },
    )
  }
}
