import { HomeClient } from '@/components/home/HomeClient'
import {
  getCurrentAuthState,
  toAuthProfileSummary,
} from '@/lib/auth/session'
import { getLatestUserBoardSession } from '@/lib/boards/server'
import type { PersistedBoardSession } from '@/types/persisted-board'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const authState = await getCurrentAuthState()
  const authSummary = toAuthProfileSummary(authState)
  let initialActiveSession: PersistedBoardSession | null = null

  if (authState.user && authState.profile?.signupCompletedAt) {
    try {
      initialActiveSession = await getLatestUserBoardSession(authState.user.id)
    } catch (error) {
      console.warn('Failed to preload active board session.', error)
    }
  }

  return (
    <HomeClient
      authSummary={authSummary}
      initialActiveSession={initialActiveSession}
    />
  )
}
