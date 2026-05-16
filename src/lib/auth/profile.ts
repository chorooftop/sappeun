import type { SupabaseClient, User } from '@supabase/supabase-js'

const MAX_DISPLAY_NAME_LENGTH = 40
const MAX_PROVIDER_LENGTH = 64
const UNIQUE_VIOLATION = '23505'

export const TERMS_VERSION = 'terms-2026-05-16'
export const PRIVACY_VERSION = 'privacy-2026-05-16'

type ConsentType = 'terms' | 'privacy'
type SignupSource = 'signup' | 'login_recovery'

interface ProfileCandidate {
  displayName: string | null
  avatarUrl: string | null
  primaryProvider: string | null
}

interface ExistingProfileRow {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  signup_completed_at: string | null
}

export interface EnsureUserProfileResult {
  isNewProfile: boolean
  signupCompletedAt: string | null
}

interface CompleteSignupOptions {
  source: SignupSource
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
): Promise<EnsureUserProfileResult> {
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
    return { isNewProfile: true, signupCompletedAt: null }
  }

  if (insertError.code !== UNIQUE_VIOLATION) {
    throw insertError
  }

  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url, signup_completed_at')
    .eq('user_id', user.id)
    .maybeSingle<ExistingProfileRow>()

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

  return {
    isNewProfile: false,
    signupCompletedAt: existingProfile.signup_completed_at,
  }
}

async function insertConsentIfMissing(
  supabase: SupabaseClient,
  userId: string,
  consentType: ConsentType,
  version: string,
  source: SignupSource,
) {
  const { error } = await supabase.from('user_consents').insert({
    user_id: userId,
    consent_type: consentType,
    version,
    source,
  })

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw error
  }
}

export async function completeSignup(
  supabase: SupabaseClient,
  userId: string,
  { source }: CompleteSignupOptions,
) {
  await insertConsentIfMissing(
    supabase,
    userId,
    'terms',
    TERMS_VERSION,
    source,
  )
  await insertConsentIfMissing(
    supabase,
    userId,
    'privacy',
    PRIVACY_VERSION,
    source,
  )

  const { error } = await supabase
    .from('profiles')
    .update({
      signup_completed_at: new Date().toISOString(),
      signup_source: source,
    })
    .eq('user_id', userId)
    .is('signup_completed_at', null)

  if (error) throw error
}
