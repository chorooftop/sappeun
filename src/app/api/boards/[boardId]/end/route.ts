import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { endUserBoard } from '@/lib/boards/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await context.params
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const ok = await endUserBoard(user.id, boardId)
    return NextResponse.json({ ok })
  } catch (error) {
    console.warn('Failed to end board.', error)
    return NextResponse.json({ error: 'Failed to end board.' }, { status: 500 })
  }
}
