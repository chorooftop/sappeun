import type { NextRequest } from 'next/server'
import { getRequestOrigin } from '@/lib/auth/redirect'

export const KAKAO_AUTH_STATE_COOKIE_NAME = 'sappeun-kakao-auth-state'

const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_OIDC_SCOPE = 'openid profile_nickname profile_image'
const KAKAO_PUBLIC_CLIENT_ID = '4cb6fbeca11ab4c039a23530d21e75a6'

export interface KakaoTokenResponse {
  access_token?: string
  id_token?: string
  error?: string
  error_description?: string
}

export function getKakaoClientId() {
  const configuredClientId = process.env.KAKAO_CLIENT_ID?.trim()
  if (configuredClientId && !configuredClientId.startsWith('http')) {
    return configuredClientId
  }

  return KAKAO_PUBLIC_CLIENT_ID
}

function getKakaoClientSecret() {
  return process.env.KAKAO_CLIENT_SECRET?.trim() || null
}

export function createKakaoOAuthValue() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getKakaoCallbackUrl(request: NextRequest) {
  return new URL('/auth/kakao/callback', getRequestOrigin(request)).toString()
}

export function getKakaoAuthorizeUrl(
  request: NextRequest,
  params: {
    state: string
  },
) {
  const clientId = getKakaoClientId()
  if (!clientId) return null

  const searchParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getKakaoCallbackUrl(request),
    response_type: 'code',
    scope: KAKAO_OIDC_SCOPE,
    state: params.state,
  })

  return `${KAKAO_AUTHORIZE_URL}?${searchParams.toString().replaceAll('+', '%20')}`
}

export async function exchangeKakaoCodeForToken(
  request: NextRequest,
  code: string,
) {
  const clientId = getKakaoClientId()
  if (!clientId) {
    throw new Error('Missing KAKAO_CLIENT_ID')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: getKakaoCallbackUrl(request),
    code,
  })

  const clientSecret = getKakaoClientSecret()
  if (clientSecret) {
    body.set('client_secret', clientSecret)
  }

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  })

  const token = (await response.json()) as KakaoTokenResponse
  if (!response.ok || !token.id_token) {
    throw new Error(
      token.error_description || token.error || 'Kakao token exchange failed',
    )
  }

  return token
}
