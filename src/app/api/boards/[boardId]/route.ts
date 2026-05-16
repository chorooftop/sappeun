import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { deleteUserBoard, getUserBoardDetail } from '@/lib/boards/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await context.params
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ board: null }, { status: 401 })
  }

  try {
    const board = await getUserBoardDetail(user.id, boardId)
    if (!board) {
      return NextResponse.json({ board: null }, { status: 404 })
    }
    return NextResponse.json({ board })
  } catch (error) {
    console.warn('Failed to load board detail.', error)
    return NextResponse.json(
      { error: 'Failed to load board detail.' },
      { status: 500 },
    )
  }
}

export async function DELETE(
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
    const ok = await deleteUserBoard(user.id, boardId)
    return NextResponse.json({ ok })
  } catch (error) {
    console.warn('Failed to delete board.', error)
    return NextResponse.json(
      { error: 'Failed to delete board.' },
      { status: 500 },
    )
  }
}
