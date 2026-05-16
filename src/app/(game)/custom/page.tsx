import { redirect } from 'next/navigation'
import { CustomBingoBuilder } from '@/components/custom/CustomBingoBuilder'
import type { BoardMode } from '@/types/bingo'

const VALID_MODES: ReadonlyArray<BoardMode> = ['5x5', '3x3']

function isBoardMode(value: string | undefined): value is BoardMode {
  return value !== undefined && (VALID_MODES as readonly string[]).includes(value)
}

interface PageProps {
  searchParams: Promise<{
    mode?: string
    nickname?: string
  }>
}

export default async function CustomPage({ searchParams }: PageProps) {
  const params = await searchParams
  const nickname = params.nickname?.trim()

  if (!isBoardMode(params.mode) || !nickname) {
    redirect('/')
  }

  return <CustomBingoBuilder mode={params.mode} nickname={nickname} />
}
