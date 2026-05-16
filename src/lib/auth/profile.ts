import type { SupabaseClient, User } from '@supabase/supabase-js'

const MAX_DISPLAY_NAME_LENGTH = 40
const MAX_PROVIDER_LENGTH = 64
const UNIQUE_VIOLATION = '23505'

interface ProfileCandidate {
  displayName: string | null
  avatarUrl: string | null
  primaryProvider: string | null
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function firstText(values: unknown[], maxLength: number) {
  for (const value of values) {
    const normalized = normalizeText(value, maxLength)
    if (normalized) return normalized
  }
  return null
}

function profileCandidateFromUser(user: User): ProfileCandidate {
  const userMetadata = user.user_metadata ?? {}
  const appMetadata = user.app_metadata ?? {}

  return {
    displayName: firstText(
      [
        userMetadata.name,
        userMetadata.full_name,
        userMetadata.nickname,
        userMetadata.preferred_username,
      ],
      MAX_DISPLAY_NAME_LENGTH,
    ),
    avatarUrl: firstText(
      [userMetadata.avatar_url, userMetadata.picture],
      2048,
    ),
    primaryProvider: firstText(
      [appMetadata.provider, user.identities?.[0]?.provider],
      MAX_PROVIDER_LENGTH,
    ),
  }
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
) {
  const candidate = profileCandidateFromUser(user)
  const now = new Date().toISOString()
  const { error: insertError } = await supabase.from('profiles').insert({
    user_id: user.id,
    display_name: candidate.displayName,
    avatar_url: candidate.avatarUrl,
    primary_provider: candidate.primaryProvider,
    last_seen_at: now,
  })

  if (!insertError) {
    return
  }

  if (insertError.code !== UNIQUE_VIOLATION) {
    throw insertError
  }

  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (selectError) throw selectError
  if (!existingProfile) {
    throw new Error('Profile row conflict occurred but row was not readable.')
  }

  const update: Record<string, string | null> = {
    last_seen_at: now,
  }

  if (!existingProfile.display_name && candidate.displayName) {
    update.display_name = candidate.displayName
  }

  if (!existingProfile.avatar_url && candidate.avatarUrl) {
    update.avatar_url = candidate.avatarUrl
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(update)
    .eq('user_id', user.id)

  if (updateError) throw updateError
}
