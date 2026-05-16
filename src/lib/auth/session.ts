import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface CurrentProfile {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  primaryProvider: string | null
  firstLoginAt: string
  lastSeenAt: string | null
  signupCompletedAt: string | null
  onboardingCompletedAt: string | null
}

export interface CurrentAuthState {
  user: User | null
  profile: CurrentProfile | null
}

export interface AuthProfileSummary {
  isAuthenticated: boolean
  isSignupCompleted: boolean
  displayName: string | null
  avatarUrl: string | null
  primaryProvider: string | null
}

interface ProfileRow {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  primary_provider: string | null
  first_login_at: string
  last_seen_at: string | null
  signup_completed_at: string | null
  onboarding_completed_at: string | null
}

function toCurrentProfile(row: ProfileRow): CurrentProfile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    primaryProvider: row.primary_provider,
    firstLoginAt: row.first_login_at,
    lastSeenAt: row.last_seen_at,
    signupCompletedAt: row.signup_completed_at,
    onboardingCompletedAt: row.onboarding_completed_at,
  }
}

export function toAuthProfileSummary(
  authState: CurrentAuthState,
): AuthProfileSummary {
  return {
    isAuthenticated: Boolean(authState.user),
    isSignupCompleted: Boolean(authState.profile?.signupCompletedAt),
    displayName: authState.profile?.displayName ?? null,
    avatarUrl: authState.profile?.avatarUrl ?? null,
    primaryProvider: authState.profile?.primaryProvider ?? null,
  }
}

export async function getCurrentUser(
  supabase?: SupabaseClient,
): Promise<User | null> {
  const client = supabase ?? (await createClient())
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) return null
  return user
}

export async function getCurrentProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CurrentProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'user_id, display_name, avatar_url, primary_provider, first_login_at, last_seen_at, signup_completed_at, onboarding_completed_at',
    )
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    console.warn('Failed to read current profile.')
    return null
  }

  return data ? toCurrentProfile(data) : null
}

export async function getCurrentAuthState(): Promise<CurrentAuthState> {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return { user: null, profile: null }
  }

  const profile = await getCurrentProfile(supabase, user.id)
  return { user, profile }
}
