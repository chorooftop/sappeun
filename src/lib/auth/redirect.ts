import type { NextRequest } from 'next/server'

const DEFAULT_NEXT_PATH = '/'
export const AUTH_NEXT_COOKIE_NAME = 'sappeun-auth-next'
export const AUTH_FLOW_COOKIE_NAME = 'sappeun-auth-flow'
export const SIGNUP_INTENT_COOKIE_NAME = 'sappeun-signup-intent'
export const AUTH_NEXT_COOKIE_PATH = '/'
export const AUTH_FLOW_LOGIN_VALUE = 'login'
export const AUTH_FLOW_SIGNUP_VALUE = 'signup'
export const SIGNUP_INTENT_ACCEPTED_VALUE = 'accepted_required_consents'

export function getSafeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_NEXT_PATH,
) {
  if (!value) return fallback

  let nextPath = value
  if (!nextPath.startsWith('/')) {
    try {
      nextPath = decodeURIComponent(nextPath)
    } catch {
      return fallback
    }
  }

  if (!nextPath.startsWith('/') || nextPath.startsWith('//') || nextPath.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(nextPath, 'https://sappeun.local')
    if (parsed.origin !== 'https://sappeun.local') return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function getAuthCallbackUrl(request: NextRequest) {
  const url = new URL('/auth/callback', getRequestOrigin(request))
  return url.toString()
}

export function getRequestOrigin(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${forwardedProto}://${forwardedHost}`
  }

  return requestUrl.origin
}

export function getLocalRedirectUrl(request: NextRequest, path: string) {
  return new URL(getSafeNextPath(path), getRequestOrigin(request))
}

export function getLoginUrl(
  request: NextRequest,
  params?: {
    error?: string
    next?: string
  },
) {
  const url = new URL('/login', getRequestOrigin(request))
  if (params?.error) url.searchParams.set('error', params.error)

  const safeNext = getSafeNextPath(params?.next)
  if (safeNext !== DEFAULT_NEXT_PATH) {
    url.searchParams.set('next', safeNext)
  }

  return url
}

export function getSignupUrl(
  request: NextRequest,
  params?: {
    error?: string
    next?: string
    reason?: string
  },
) {
  const url = new URL('/signup', getRequestOrigin(request))
  if (params?.error) url.searchParams.set('error', params.error)
  if (params?.reason) url.searchParams.set('reason', params.reason)

  const safeNext = getSafeNextPath(params?.next)
  if (safeNext !== DEFAULT_NEXT_PATH) {
    url.searchParams.set('next', safeNext)
  }

  return url
}

export function getSignupCompleteUrl(
  request: NextRequest,
  params?: {
    next?: string
  },
) {
  const url = new URL('/signup/complete', getRequestOrigin(request))
  const safeNext = getSafeNextPath(params?.next)
  if (safeNext !== DEFAULT_NEXT_PATH) {
    url.searchParams.set('next', safeNext)
  }

  return url
}
