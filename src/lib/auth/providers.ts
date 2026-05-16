import type { Provider } from '@supabase/supabase-js'
import { getKakaoClientId } from '@/lib/auth/kakao'

export type AuthProviderId = 'kakao' | 'google' | 'apple'

export interface AuthProviderConfig {
  id: AuthProviderId
  provider: Provider
  label: string
  shortLabel: string
}

export interface AuthProviderOption extends AuthProviderConfig {
  enabled: boolean
}

export const AUTH_PROVIDERS: AuthProviderConfig[] = [
  {
    id: 'kakao',
    provider: 'kakao',
    label: '카카오톡으로 계속하기',
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

function getPreviewProviderIds() {
  return new Set(
    (process.env.AUTH_PREVIEW_PROVIDERS ?? 'kakao')
      .split(',')
      .map((provider) => provider.trim())
      .filter(Boolean),
  )
}

function providerHasRuntimeConfig(provider: AuthProviderConfig) {
  if (provider.id === 'kakao') return Boolean(getKakaoClientId())
  return true
}

export function getAuthProviderOptions(): AuthProviderOption[] {
  const enabledProviderIds = getEnabledProviderIds()
  const previewProviderIds = getPreviewProviderIds()

  return AUTH_PROVIDERS.filter(
    (provider) =>
      enabledProviderIds.has(provider.id) || previewProviderIds.has(provider.id),
  ).map((provider) => ({
    ...provider,
    enabled:
      enabledProviderIds.has(provider.id) && providerHasRuntimeConfig(provider),
  }))
}

export function getEnabledAuthProviders() {
  const enabledProviderIds = getEnabledProviderIds()
  return AUTH_PROVIDERS.filter(
    (provider) =>
      enabledProviderIds.has(provider.id) && providerHasRuntimeConfig(provider),
  )
}

export function getAuthProvider(providerId: string) {
  return (
    getEnabledAuthProviders().find((provider) => provider.id === providerId) ??
    null
  )
}
