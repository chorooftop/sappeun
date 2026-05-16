import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { adoptGuestBoardSession } from '@/lib/boards/server'
import { boardSessionSchema } from '@/lib/boards/validation'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = boardSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid board session.' }, { status: 400 })
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ session: null }, { status: 401 })
  }

  try {
    return NextResponse.json({
      session: await adoptGuestBoardSession({
        userId: user.id,
        session: parsed.data,
      }),
    })
  } catch (error) {
    console.warn('Failed to adopt guest board session.', error)
    return NextResponse.json(
      { error: 'Failed to adopt guest board session.' },
      { status: 500 },
    )
  }
}
