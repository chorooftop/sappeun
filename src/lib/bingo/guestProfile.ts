'use client'

const GUEST_PROFILE_KEY = 'sappeun-guest-profile-v1'

export interface GuestProfile {
  version: 1
  nickname: string
  updatedAt: string
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch (error) {
    console.warn('Unable to access localStorage', error)
    return null
  }
}

export function loadGuestProfile(): GuestProfile | null {
  const storage = getLocalStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(GUEST_PROFILE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const profile = parsed as Record<string, unknown>
    if (profile.version !== 1 || typeof profile.nickname !== 'string') {
      return null
    }

    return {
      version: 1,
      nickname: profile.nickname,
      updatedAt:
        typeof profile.updatedAt === 'string'
          ? profile.updatedAt
          : new Date().toISOString(),
    }
  } catch (error) {
    console.warn('Unable to load guest profile', error)
    return null
  }
}

export function saveGuestNickname(nickname: string): void {
  const storage = getLocalStorage()
  const trimmed = nickname.trim()
  if (!storage || !trimmed) return

  try {
    storage.setItem(
      GUEST_PROFILE_KEY,
      JSON.stringify({
        version: 1,
        nickname: trimmed,
        updatedAt: new Date().toISOString(),
      } satisfies GuestProfile),
    )
  } catch (error) {
    console.warn('Unable to save guest profile', error)
  }
}
