import { redirect } from 'next/navigation'
import { BingoBoard } from '@/components/bingo/Board'
import { composeBoard } from '@/lib/bingo/compose'
import type { BoardMode } from '@/types/bingo'

const VALID_MODES: ReadonlyArray<BoardMode> = ['standard', '5x5', '3x3']

function isBoardMode(value: string | undefined): value is BoardMode {
  return value !== undefined && (VALID_MODES as readonly string[]).includes(value)
}

interface PageProps {
  searchParams: Promise<{
    mode?: string
    nickname?: string
  }>
}

export default async function BingoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const nickname = params.nickname?.trim()

  if (!isBoardMode(params.mode) || !nickname) {
    redirect('/')
  }

  const { cells, freePosition } = composeBoard(params.mode)

  return (
    <BingoBoard
      mode={params.mode}
      nickname={nickname}
      cells={cells}
      freePosition={freePosition}
    />
  )
}
