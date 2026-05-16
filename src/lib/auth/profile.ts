import type { SupabaseClient, User } from '@supabase/supabase-js'
import { isMissingColumnError } from '@/lib/supabase/errors'

const MAX_DISPLAY_NAME_LENGTH = 40
const MAX_NICKNAME_LENGTH = 10
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
  nickname?: string | null
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

function profileInsertPayload(
  user: User,
  candidate: ProfileCandidate,
  now: string,
  includeNickname: boolean,
) {
  return {
    user_id: user.id,
    ...(includeNickname
      ? {
          nickname:
            candidate.displayName?.slice(0, MAX_NICKNAME_LENGTH) ?? null,
        }
      : {}),
    display_name: candidate.displayName,
    avatar_url: candidate.avatarUrl,
    primary_provider: candidate.primaryProvider,
    last_seen_at: now,
  }
}

async function insertProfile(
  supabase: SupabaseClient,
  user: User,
  candidate: ProfileCandidate,
  now: string,
  includeNickname: boolean,
) {
  return supabase
    .from('profiles')
    .insert(profileInsertPayload(user, candidate, now, includeNickname))
}

async function readExistingProfile(
  supabase: SupabaseClient,
  userId: string,
  includeNickname: boolean,
) {
  return supabase
    .from('profiles')
    .select(
      includeNickname
        ? 'user_id, nickname, display_name, avatar_url, signup_completed_at'
        : 'user_id, display_name, avatar_url, signup_completed_at',
    )
    .eq('user_id', userId)
    .maybeSingle<ExistingProfileRow>()
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<EnsureUserProfileResult> {
  const candidate = profileCandidateFromUser(user)
  const now = new Date().toISOString()
  let nicknameColumnAvailable = true
  let { error: insertError } = await insertProfile(
    supabase,
    user,
    candidate,
    now,
    nicknameColumnAvailable,
  )

  if (insertError && isMissingColumnError(insertError, ['nickname'])) {
    nicknameColumnAvailable = false
    ;({ error: insertError } = await insertProfile(
      supabase,
      user,
      candidate,
      now,
      nicknameColumnAvailable,
    ))
  }

  if (!insertError) {
    return { isNewProfile: true, signupCompletedAt: null }
  }

  if (insertError.code !== UNIQUE_VIOLATION) {
    throw insertError
  }

  let { data: existingProfile, error: selectError } = await readExistingProfile(
    supabase,
    user.id,
    nicknameColumnAvailable,
  )

  if (
    selectError &&
    nicknameColumnAvailable &&
    isMissingColumnError(selectError, ['nickname'])
  ) {
    nicknameColumnAvailable = false
    ;({ data: existingProfile, error: selectError } = await readExistingProfile(
      supabase,
      user.id,
      nicknameColumnAvailable,
    ))
  }

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

  if (
    nicknameColumnAvailable &&
    !existingProfile.nickname &&
    candidate.displayName
  ) {
    update.nickname = candidate.displayName.slice(0, MAX_NICKNAME_LENGTH)
    update.nickname_updated_at = now
  }

  if (!existingProfile.avatar_url && candidate.avatarUrl) {
    update.avatar_url = candidate.avatarUrl
  }

  let { error: updateError } = await supabase
    .from('profiles')
    .update(update)
    .eq('user_id', user.id)

  if (
    updateError &&
    nicknameColumnAvailable &&
    isMissingColumnError(updateError, ['nickname', 'nickname_updated_at'])
  ) {
    delete update.nickname
    delete update.nickname_updated_at
    ;({ error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('user_id', user.id))
  }

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
