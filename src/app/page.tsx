import { HomeClient } from '@/components/home/HomeClient'
import {
  getCurrentAuthState,
  toAuthProfileSummary,
} from '@/lib/auth/session'

export default async function Home() {
  const authState = await getCurrentAuthState()

  return <HomeClient authSummary={toAuthProfileSummary(authState)} />
}
