import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { listUserBoards } from '@/lib/boards/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ boards: [] }, { status: 401 })
  }

  try {
    return NextResponse.json({ boards: await listUserBoards(user.id) })
  } catch (error) {
    console.warn('Failed to list boards.', error)
    return NextResponse.json(
      { error: 'Failed to list boards.' },
      { status: 500 },
    )
  }
}
