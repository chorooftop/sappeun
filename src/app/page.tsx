import { HomeClient } from '@/components/home/HomeClient'
import {
  getCurrentAuthState,
  toAuthProfileSummary,
} from '@/lib/auth/session'
import { getLatestUserBoardSession } from '@/lib/photos/server'
import type { PersistedBoardSessionV2 } from '@/types/persisted-board'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const authState = await getCurrentAuthState()
  const authSummary = toAuthProfileSummary(authState)
  let initialActiveSession: PersistedBoardSessionV2 | null = null

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
