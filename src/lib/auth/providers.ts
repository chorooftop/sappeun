import type { Provider } from '@supabase/supabase-js'

export type AuthProviderId = 'kakao' | 'google' | 'apple'

export interface AuthProviderConfig {
  id: AuthProviderId
  provider: Provider
  label: string
  shortLabel: string
}

export const AUTH_PROVIDERS: AuthProviderConfig[] = [
  {
    id: 'kakao',
    provider: 'kakao',
    label: '카카오로 계속하기',
    shortLabel: 'K',
  },
  {
    id: 'google',
    provider: 'google',
    label: 'Google로 계속하기',
    shortLabel: 'G',
  },
  {
    id: 'apple',
    provider: 'apple',
    label: 'Apple로 계속하기',
    shortLabel: 'A',
  },
]

function getEnabledProviderIds() {
  return new Set(
    (process.env.AUTH_ENABLED_PROVIDERS ?? '')
      .split(',')
      .map((provider) => provider.trim())
      .filter(Boolean),
  )
}

export function getEnabledAuthProviders() {
  const enabledProviderIds = getEnabledProviderIds()
  return AUTH_PROVIDERS.filter((provider) => enabledProviderIds.has(provider.id))
}

export function getAuthProvider(providerId: string) {
  return (
    getEnabledAuthProviders().find((provider) => provider.id === providerId) ??
    null
  )
}
