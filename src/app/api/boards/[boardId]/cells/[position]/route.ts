import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import {
  markUserBoardCell,
  replaceUserBoardCell,
} from '@/lib/boards/server'
import {
  markBoardCellSchema,
  replaceBoardCellSchema,
} from '@/lib/boards/validation'
import { createClient } from '@/lib/supabase/server'

function parsePosition(value: string) {
  const position = Number(value)
  if (!Number.isInteger(position) || position < 0 || position > 24) return null
  return position
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ boardId: string; position: string }> },
) {
  const { boardId, position: rawPosition } = await context.params
  const position = parsePosition(rawPosition)
  if (position === null) {
    return NextResponse.json({ error: 'Invalid position.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = markBoardCellSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid board cell.' }, { status: 400 })
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    await markUserBoardCell({
      userId: user.id,
      boardId,
      position,
      cellId: parsed.data.cellId,
      marked: parsed.data.marked,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.warn('Failed to update board cell.', error)
    return NextResponse.json(
      { error: 'Failed to update board cell.' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ boardId: string; position: string }> },
) {
  const { boardId, position: rawPosition } = await context.params
  const position = parsePosition(rawPosition)
  if (position === null) {
    return NextResponse.json({ error: 'Invalid position.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = replaceBoardCellSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid board cell.' }, { status: 400 })
  }

  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    await replaceUserBoardCell({
      userId: user.id,
      boardId,
      position,
      cellId: parsed.data.cellId,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.warn('Failed to replace board cell.', error)
    return NextResponse.json(
      { error: 'Failed to replace board cell.' },
      { status: 500 },
    )
  }
}
