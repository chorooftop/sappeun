import type { NextRequest } from 'next/server'

const DEFAULT_NEXT_PATH = '/'

export function getSafeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_NEXT_PATH,
) {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(value, 'https://sappeun.local')
    if (parsed.origin !== 'https://sappeun.local') return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function getAuthCallbackUrl(request: NextRequest, nextPath?: string) {
  const url = new URL('/auth/callback', getRequestOrigin(request))
  const safeNext = getSafeNextPath(nextPath)
  if (safeNext !== DEFAULT_NEXT_PATH) {
    url.searchParams.set('next', safeNext)
  }
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
