import { notFound, redirect } from 'next/navigation'
import { WalkDetailClient } from '@/components/walks/WalkDetailClient'
import { getCurrentAuthState } from '@/lib/auth/session'
import { getUserBoardDetail } from '@/lib/boards/server'

interface PageProps {
  params: Promise<{
    boardId: string
  }>
}

export default async function WalkDetailPage({ params }: PageProps) {
  const authState = await getCurrentAuthState()
  if (!authState.user || !authState.profile?.signupCompletedAt) {
    redirect(`/login?${new URLSearchParams({ next: '/walks' }).toString()}`)
  }

  const { boardId } = await params
  const board = await getUserBoardDetail(authState.user.id, boardId)
  if (!board) notFound()

  return <WalkDetailClient board={board} />
}
